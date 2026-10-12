/*
 * Minimal SDL_mixer replacement for the WebAssembly build of 7k2.
 *
 * Emscripten's built-in SDL_mixer emulation lacks Mix_QuickLoad_WAV (which the
 * game uses for every sound effect) and Mix_FadeOutChannel throws, so the web
 * build uses this small mixer instead (see web_mixer.cpp). Only the subset of
 * the API that the game calls is provided.
 *
 * The functions are renamed with macros so they can never clash with the
 * Mix_* symbols of Emscripten's own JavaScript library.
 */
#ifndef WEBMIX_SDL_MIXER_H
#define WEBMIX_SDL_MIXER_H

#include <SDL/SDL.h>

#ifdef __cplusplus
extern "C" {
#endif

#define MIX_MAX_VOLUME      128
#define MIX_DEFAULT_FORMAT  AUDIO_S16SYS

typedef enum { MIX_NO_FADING, MIX_FADING_OUT, MIX_FADING_IN } Mix_Fading;

typedef struct Mix_Chunk {
	int    allocated;
	Uint8 *abuf;
	Uint32 alen;
	Uint8  volume;
} Mix_Chunk;

int        webmix_Init(int flags);
void       webmix_Quit(void);
int        webmix_OpenAudio(int frequency, Uint16 format, int channels, int chunksize);
void       webmix_CloseAudio(void);
int        webmix_AllocateChannels(int numchans);
int        webmix_Volume(int channel, int volume);
Mix_Chunk *webmix_QuickLoad_WAV(Uint8 *mem);
Mix_Chunk *webmix_LoadWAV(const char *file);
void       webmix_FreeChunk(Mix_Chunk *chunk);
int        webmix_PlayChannel(int channel, Mix_Chunk *chunk, int loops);
int        webmix_Playing(int channel);
int        webmix_HaltChannel(int channel);
int        webmix_FadeOutChannel(int which, int ms);
Mix_Fading webmix_FadingChannel(int which);

#define Mix_Init             webmix_Init
#define Mix_Quit             webmix_Quit
#define Mix_OpenAudio        webmix_OpenAudio
#define Mix_CloseAudio       webmix_CloseAudio
#define Mix_AllocateChannels webmix_AllocateChannels
#define Mix_Volume           webmix_Volume
#define Mix_QuickLoad_WAV    webmix_QuickLoad_WAV
#define Mix_LoadWAV          webmix_LoadWAV
#define Mix_FreeChunk        webmix_FreeChunk
#define Mix_PlayChannel      webmix_PlayChannel
#define Mix_Playing          webmix_Playing
#define Mix_HaltChannel      webmix_HaltChannel
#define Mix_FadeOutChannel   webmix_FadeOutChannel
#define Mix_FadingChannel    webmix_FadingChannel

#ifdef __cplusplus
}
#endif

#endif /* WEBMIX_SDL_MIXER_H */
