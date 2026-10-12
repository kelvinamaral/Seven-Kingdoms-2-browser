# Build of Seven Kingdoms II (mecirt/7k2) for WebAssembly with Emscripten.
#
#   make -j2 SRC=/path/to/7k2 JPEG=/path/to/libjpeg-wasm
#
# Produces out/7k2.html (+ .js, .wasm, loader.js). The game data is NOT
# included: the page asks the player to select their own copy of the game.

SRC     ?= ..
JPEG    ?= /path/to/libjpeg-wasm
OBJDIR  ?= obj
OUT     ?= out

CXX      = em++
SOURCES  = $(shell cat sources.txt) web/web_mixer.cpp web/web_entry.cpp
OBJS     = $(patsubst %.cpp,$(OBJDIR)/%.o,$(notdir $(SOURCES)))

# web/shim comes first so <SDL/SDL_mixer.h> resolves to our replacement
CXXFLAGS = -O2 -fpermissive -w \
           -Iweb/shim -I$(SRC)/include -I$(JPEG)/include -I$(SRC) \
           -D__EMSCRIPTEN_WEB__ -sUSE_SDL=1

LDFLAGS  = -O2 -sUSE_SDL=1 \
           -sASYNCIFY -sASYNCIFY_STACK_SIZE=1048576 \
           -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=268435456 -sMAXIMUM_MEMORY=2147483648 \
           -sTOTAL_STACK=5242880 \
           -lidbfs.js -sFORCE_FILESYSTEM=1 -sEXIT_RUNTIME=0 \
           -sEXPORTED_FUNCTIONS=_web_entry -sEXPORTED_RUNTIME_METHODS=FS,ccall \
           -sMINIFY_HTML=0 --shell-file web/shell.html

vpath %.cpp $(SRC) $(SRC)/src web

all: $(OUT)/7k2.html

$(OBJDIR)/%.o: %.cpp
	@mkdir -p $(OBJDIR)
	$(CXX) -c $(CXXFLAGS) $< -o $@

$(OUT)/7k2.html: $(OBJS) web/shell.html web/loader.js
	@mkdir -p $(OUT)
	$(CXX) $(LDFLAGS) $(OBJS) $(JPEG)/lib/libjpeg.a -o $@
	cp web/loader.js $(OUT)/loader.js

clean:
	rm -rf $(OBJDIR) $(OUT)

.PHONY: all clean
