/*
 * Small software mixer used by the WebAssembly build of Seven Kingdoms II.
 * Implements the subset of SDL_mixer that oaudio.cpp uses, on top of the
 * callback-based SDL 1.2 audio that Emscripten provides.
 *
 * - Sound effects (Mix_QuickLoad_WAV) are copied into memory.
 * - Long files (Mix_LoadWAV, i.e. the background music) larger than 1 MB are
 *   streamed from the file system in 64 KB blocks instead of being loaded.
 * - Everything is mixed at 44.1 kHz stereo with linear interpolation, so 11 kHz
 *   mono effects and 44.1 kHz stereo music can play together.
 *
 * Only uncompressed PCM WAV (8 or 16 bit, mono or stereo) is supported.
 *
 * Licensed under the same terms as the game source (GPL v2 or later).
 */

#include <SDL/SDL_mixer.h>

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CHANNELS    32
#define STREAM_LIMIT    (1u << 20)      // data larger than this is streamed
#define CACHE_SIZE      (64u * 1024u)   // streaming window, multiple of 1, 2 and 4
#define DEVICE_RATE     44100

struct WebChunk
{
	Mix_Chunk pub;              // must stay first: the game only sees this part
	int       rate, channels, bits;
	uint32_t  frames;
	uint32_t  frame_bytes;
	uint8_t  *mem;              // resident PCM data, or NULL when streaming
	FILE     *fp;               // stream source
	long      data_offset;
	uint8_t  *cache;
	uint32_t  cache_start, cache_len;
};

struct Channel
{
	WebChunk *chunk;
	double    pos;              // position in source frames
	double    step;             // source frames per output frame
	int       volume;           // 0..MIX_MAX_VOLUME, persists between sounds
	int       loops;            // -1 = forever, otherwise remaining repeats
	int       active;
	int       fading;
	int       fade_total, fade_left;
};

static Channel g_chan[MAX_CHANNELS];
static int     g_num_chan = 8;
static int     g_opened = 0;
static int     g_dev_rate = DEVICE_RATE;
static float  *g_acc = NULL;
static int     g_acc_frames = 0;

// ---------------------------------------------------------------- WAV parsing

struct WavInfo
{
	int      ok;
	int      rate, channels, bits;
	uint32_t data_offset, data_len;
};

static uint32_t rd32(const uint8_t *p) { return p[0] | (p[1] << 8) | (p[2] << 16) | ((uint32_t) p[3] << 24); }
static uint32_t rd16(const uint8_t *p) { return p[0] | (p[1] << 8); }

// Parse a RIFF/WAVE header that starts at buf. limit = number of readable bytes.
static WavInfo parse_wav(const uint8_t *buf, size_t limit)
{
	WavInfo w;
	memset(&w, 0, sizeof(w));

	if (limit < 12 || memcmp(buf, "RIFF", 4) != 0 || memcmp(buf + 8, "WAVE", 4) != 0)
		return w;

	size_t   off = 12;
	int      have_fmt = 0;
	uint32_t tag = 0;

	for (int guard = 0; guard < 64 && off + 8 <= limit; guard++)
	{
		uint32_t size = rd32(buf + off + 4);

		if (memcmp(buf + off, "fmt ", 4) == 0 && size >= 16 && off + 8 + 16 <= limit)
		{
			tag        = rd16(buf + off + 8);
			w.channels = (int) rd16(buf + off + 10);
			w.rate     = (int) rd32(buf + off + 12);
			w.bits     = (int) rd16(buf + off + 22);
			have_fmt   = 1;
		}
		else if (memcmp(buf + off, "data", 4) == 0)
		{
			if (!have_fmt)
				return w;
			if (tag != 1 && tag != 0xFFFE)
			{
				fprintf(stderr, "webmix: unsupported WAV format tag 0x%x (only PCM is supported)\n", tag);
				return w;
			}
			if ((w.bits != 8 && w.bits != 16) || w.channels < 1 || w.channels > 2 || w.rate <= 0)
			{
				fprintf(stderr, "webmix: unsupported WAV layout (%d bit, %d ch, %d Hz)\n", w.bits, w.channels, w.rate);
				return w;
			}
			w.data_offset = (uint32_t) (off + 8);
			w.data_len    = size;
			w.ok          = 1;
			return w;
		}

		off += 8 + (size_t) size + (size & 1);
	}
	return w;
}

static WebChunk *new_chunk(const WavInfo &w, uint32_t data_len)
{
	WebChunk *c = (WebChunk *) calloc(1, sizeof(WebChunk));
	if (!c)
		return NULL;
	c->rate        = w.rate;
	c->channels    = w.channels;
	c->bits        = w.bits;
	c->frame_bytes = (uint32_t) (w.channels * (w.bits / 8));
	c->frames      = data_len / c->frame_bytes;
	c->pub.allocated = 1;
	c->pub.alen      = c->frames * c->frame_bytes;
	c->pub.volume    = MIX_MAX_VOLUME;
	return c;
}

// ------------------------------------------------------------------ Chunk API

extern "C" Mix_Chunk *webmix_QuickLoad_WAV(Uint8 *mem)
{
	// the buffer length is not known: the header is searched within 1 MB at most
	WavInfo w = parse_wav(mem, 1u << 20);
	if (!w.ok || w.data_len > (128u << 20))
		return NULL;

	WebChunk *c = new_chunk(w, w.data_len);
	if (!c)
		return NULL;

	c->mem = (uint8_t *) malloc(c->pub.alen ? c->pub.alen : 1);
	if (!c->mem) { free(c); return NULL; }
	memcpy(c->mem, mem + w.data_offset, c->pub.alen);	// copy: the game reuses its buffer
	c->pub.abuf = c->mem;
	return &c->pub;
}

extern "C" Mix_Chunk *webmix_LoadWAV(const char *file)
{
	FILE *fp = fopen(file, "rb");
	if (!fp)
		return NULL;

	fseek(fp, 0, SEEK_END);
	long file_size = ftell(fp);
	fseek(fp, 0, SEEK_SET);

	uint8_t head[16 * 1024];
	size_t  n = fread(head, 1, sizeof(head), fp);
	WavInfo w = parse_wav(head, n);
	if (!w.ok || (long) w.data_offset > file_size)
	{
		fclose(fp);
		return NULL;
	}

	uint32_t data_len = w.data_len;
	if ((long) data_len > file_size - (long) w.data_offset)
		data_len = (uint32_t) (file_size - (long) w.data_offset);	// truncated / streaming-style header

	WebChunk *c = new_chunk(w, data_len);
	if (!c)
	{
		fclose(fp);
		return NULL;
	}

	if (c->pub.alen <= STREAM_LIMIT)
	{
		c->mem = (uint8_t *) malloc(c->pub.alen ? c->pub.alen : 1);
		if (c->mem)
		{
			fseek(fp, (long) w.data_offset, SEEK_SET);
			size_t got = fread(c->mem, 1, c->pub.alen, fp);
			if (got < c->pub.alen)
			{
				c->pub.alen = (uint32_t) got - (uint32_t) (got % c->frame_bytes);
				c->frames   = c->pub.alen / c->frame_bytes;
			}
			c->pub.abuf = c->mem;
			fclose(fp);
			return &c->pub;
		}
	}

	// long file: keep it open and stream it
	c->fp          = fp;
	c->data_offset = (long) w.data_offset;
	c->cache       = (uint8_t *) malloc(CACHE_SIZE);
	if (!c->cache)
	{
		fclose(fp);
		free(c);
		return NULL;
	}
	return &c->pub;
}

extern "C" void webmix_FreeChunk(Mix_Chunk *chunk)
{
	if (!chunk)
		return;
	WebChunk *c = (WebChunk *) chunk;

	for (int i = 0; i < MAX_CHANNELS; i++)
		if (g_chan[i].chunk == c)
		{
			g_chan[i].chunk  = NULL;
			g_chan[i].active = 0;
		}

	if (c->fp)
		fclose(c->fp);
	free(c->cache);
	free(c->mem);
	free(c);
}

// -------------------------------------------------------------------- mixing

static const uint8_t g_zero_frame[4] = { 0, 0, 0, 0 };

// pointer to the bytes of one source frame (refills the streaming window when needed)
static inline const uint8_t *frame_ptr(WebChunk *c, uint32_t frame)
{
	uint32_t off = frame * c->frame_bytes;
	if (c->mem)
		return c->mem + off;

	if (off < c->cache_start || off + c->frame_bytes > c->cache_start + c->cache_len)
	{
		uint32_t total = c->frames * c->frame_bytes;
		uint32_t want  = CACHE_SIZE;
		if (off + want > total)
			want = total - off;
		fseek(c->fp, c->data_offset + (long) off, SEEK_SET);
		size_t got = fread(c->cache, 1, want, c->fp);
		c->cache_start = off;
		c->cache_len   = (uint32_t) (got - (got % c->frame_bytes));
		if (c->cache_len == 0)
			return g_zero_frame;
	}
	return c->cache + (off - c->cache_start);
}

static inline void get_frame(WebChunk *c, uint32_t frame, float *l, float *r)
{
	const uint8_t *p = frame_ptr(c, frame);
	if (c->bits == 16)
	{
		int a = (int16_t) (p[0] | (p[1] << 8));
		*l = (float) a;
		*r = c->channels == 2 ? (float) (int16_t) (p[2] | (p[3] << 8)) : (float) a;
	}
	else
	{
		int a = ((int) p[0] - 128) << 8;
		*l = (float) a;
		*r = c->channels == 2 ? (float) (((int) p[1] - 128) << 8) : (float) a;
	}
}

static void mix_callback(void *userdata, Uint8 *stream, int len)
{
	int16_t *out    = (int16_t *) stream;
	int      frames = len / 4;			// 16-bit stereo

	if (frames > g_acc_frames)
	{
		free(g_acc);
		g_acc = (float *) malloc((size_t) frames * 2 * sizeof(float));
		g_acc_frames = g_acc ? frames : 0;
		if (!g_acc) { memset(stream, 0, len); return; }
	}
	memset(g_acc, 0, (size_t) frames * 2 * sizeof(float));

	for (int ci = 0; ci < g_num_chan; ci++)
	{
		Channel *ch = &g_chan[ci];
		if (!ch->active || !ch->chunk || ch->chunk->frames == 0)
			continue;
		WebChunk *c    = ch->chunk;
		float     gain = (float) ch->volume / (float) MIX_MAX_VOLUME;

		for (int i = 0; i < frames; i++)
		{
			if (ch->pos >= (double) c->frames)
			{
				if (ch->loops != 0)
				{
					ch->pos -= (double) c->frames;
					if (ch->loops > 0)
						ch->loops--;
				}
				else
				{
					ch->active = 0;
					break;
				}
			}

			uint32_t f0 = (uint32_t) ch->pos;
			uint32_t f1 = f0 + 1;
			if (f1 >= c->frames)
				f1 = ch->loops != 0 ? 0 : f0;
			float frac = (float) (ch->pos - (double) f0);

			float l0, r0, l1, r1;
			get_frame(c, f0, &l0, &r0);
			get_frame(c, f1, &l1, &r1);

			float g = gain;
			if (ch->fading)
				g *= (float) ch->fade_left / (float) ch->fade_total;

			g_acc[2 * i]     += (l0 + (l1 - l0) * frac) * g;
			g_acc[2 * i + 1] += (r0 + (r1 - r0) * frac) * g;

			ch->pos += ch->step;

			if (ch->fading && --ch->fade_left <= 0)
			{
				ch->active = 0;
				ch->fading = 0;
				break;
			}
		}
	}

	for (int i = 0; i < frames * 2; i++)
	{
		float v = g_acc[i];
		if (v > 32767.f)  v = 32767.f;
		if (v < -32768.f) v = -32768.f;
		out[i] = (int16_t) v;
	}
}

// ---------------------------------------------------------------- device / API

extern "C" int webmix_Init(int flags) { return 0; }

extern "C" void webmix_Quit(void) {}

extern "C" int webmix_OpenAudio(int frequency, Uint16 format, int channels, int chunksize)
{
	if (g_opened)
		return 0;

	if (!SDL_WasInit(SDL_INIT_AUDIO) && SDL_InitSubSystem(SDL_INIT_AUDIO) < 0)
		return -1;

	for (int i = 0; i < MAX_CHANNELS; i++)
	{
		memset(&g_chan[i], 0, sizeof(Channel));
		g_chan[i].volume = MIX_MAX_VOLUME;
	}

	// The requested 11 kHz mono is deliberately ignored: the device runs at
	// 44.1 kHz stereo and every sound is resampled to it.
	SDL_AudioSpec want, have;
	memset(&want, 0, sizeof(want));
	want.freq     = DEVICE_RATE;
	want.format   = AUDIO_S16SYS;
	want.channels = 2;
	want.samples  = 2048;
	want.callback = mix_callback;

	if (SDL_OpenAudio(&want, &have) < 0)
		return -1;
	if (have.format != AUDIO_S16SYS || have.channels != 2)
	{
		SDL_CloseAudio();
		return -1;
	}

	g_dev_rate = have.freq > 0 ? have.freq : DEVICE_RATE;
	g_opened = 1;
	SDL_PauseAudio(0);
	return 0;
}

extern "C" void webmix_CloseAudio(void)
{
	if (!g_opened)
		return;
	SDL_CloseAudio();
	g_opened = 0;
	for (int i = 0; i < MAX_CHANNELS; i++)
		g_chan[i].active = 0;
}

extern "C" int webmix_AllocateChannels(int numchans)
{
	if (numchans > 0)
		g_num_chan = numchans > MAX_CHANNELS ? MAX_CHANNELS : numchans;
	return g_num_chan;
}

extern "C" int webmix_Volume(int channel, int volume)
{
	if (channel < 0)
	{
		// all channels: report the average, optionally set them all
		int sum = 0;
		for (int i = 0; i < g_num_chan; i++)
		{
			sum += g_chan[i].volume;
			if (volume >= 0)
				g_chan[i].volume = volume > MIX_MAX_VOLUME ? MIX_MAX_VOLUME : volume;
		}
		return g_num_chan ? sum / g_num_chan : 0;
	}
	if (channel >= g_num_chan)
		return 0;

	int prev = g_chan[channel].volume;
	if (volume >= 0)
		g_chan[channel].volume = volume > MIX_MAX_VOLUME ? MIX_MAX_VOLUME : volume;
	return prev;
}

extern "C" int webmix_PlayChannel(int channel, Mix_Chunk *chunk, int loops)
{
	if (!chunk || !g_opened)
		return -1;

	if (channel < 0)
	{
		for (int i = 0; i < g_num_chan; i++)
			if (!g_chan[i].active) { channel = i; break; }
		if (channel < 0)
			return -1;		// all channels busy
	}
	else if (channel >= g_num_chan)
		return -1;

	Channel  *ch = &g_chan[channel];
	WebChunk *c  = (WebChunk *) chunk;

	ch->chunk      = c;
	ch->pos        = 0;
	ch->step       = (double) c->rate / (double) g_dev_rate;
	ch->loops      = loops;
	ch->fading     = 0;
	ch->fade_total = ch->fade_left = 0;
	ch->active     = 1;
	return channel;
}

extern "C" int webmix_Playing(int channel)
{
	if (channel < 0)
	{
		int n = 0;
		for (int i = 0; i < g_num_chan; i++)
			n += g_chan[i].active ? 1 : 0;
		return n;
	}
	return channel < g_num_chan && g_chan[channel].active ? 1 : 0;
}

extern "C" int webmix_HaltChannel(int channel)
{
	if (channel < 0)
	{
		for (int i = 0; i < g_num_chan; i++)
			g_chan[i].active = g_chan[i].fading = 0;
	}
	else if (channel < g_num_chan)
		g_chan[channel].active = g_chan[channel].fading = 0;
	return 0;
}

extern "C" int webmix_FadeOutChannel(int which, int ms)
{
	int count = 0;
	int total = (int) ((long long) (ms > 1 ? ms : 1) * g_dev_rate / 1000);

	for (int i = 0; i < g_num_chan; i++)
	{
		if (which >= 0 && which != i)
			continue;
		if (!g_chan[i].active)
			continue;
		g_chan[i].fading     = 1;
		g_chan[i].fade_total = g_chan[i].fade_left = total > 0 ? total : 1;
		count++;
	}
	return count;
}

extern "C" Mix_Fading webmix_FadingChannel(int which)
{
	if (which < 0 || which >= g_num_chan)
		return MIX_NO_FADING;
	return (g_chan[which].active && g_chan[which].fading) ? MIX_FADING_OUT : MIX_NO_FADING;
}
