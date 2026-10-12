// Entry point for the browser build.
//
// The game's main(argc, argv) is compiled by clang as __main_argc_argv, and the
// Emscripten shipped with some distributions cannot export it as "_main".
// loader.js therefore calls web_entry() (through ccall, with Asyncify) instead.

#include <emscripten.h>

extern "C" int __main_argc_argv(int argc, char **argv);

extern "C" EMSCRIPTEN_KEEPALIVE int web_entry(void)
{
	char arg0[] = "7k2";
	char *argv[] = { arg0, 0 };
	return __main_argc_argv(1, argv);
}
