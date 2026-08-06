#!/usr/bin/env python3
"""Tiny static server for local preview of this directory."""
import functools
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8770


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # No caching, so edits show up on reload during development.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    os.chdir(ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=ROOT)
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"serving {ROOT} on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
