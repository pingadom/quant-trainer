"""
Development server: like `python -m http.server`, but tells the browser never to cache, so an
edited file is always the one that runs. (Python's built-in server sends no cache headers, and
browsers then guess, which can leave a stale script running after an edit.)

    python tools/serve.py [port] [directory]      # defaults: 8765, the project root
"""

import functools
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the console quiet; errors still print
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    directory = sys.argv[2] if len(sys.argv) > 2 else "."
    handler = functools.partial(NoCacheHandler, directory=directory)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Serving {directory} at http://localhost:{port}/ (no caching)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
