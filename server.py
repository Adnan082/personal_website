#!/usr/bin/env python3
"""
CheemaTech Dev Server
─────────────────────
Usage:
    python server.py          # runs on port 3000 (default)
    python server.py 8080     # runs on port 8080

Requires: Python 3.8+  (stdlib only, no pip installs needed)
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from threading import Timer

# ── Config ──────────────────────────────────────
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
ROOT = os.path.dirname(os.path.abspath(__file__))

ANSI_RESET  = "\033[0m"
ANSI_BOLD   = "\033[1m"
ANSI_PURPLE = "\033[35m"
ANSI_CYAN   = "\033[36m"
ANSI_GREY   = "\033[90m"
ANSI_GREEN  = "\033[32m"


class DevHandler(http.server.SimpleHTTPRequestHandler):
    """Static file handler with dev-friendly headers and logging."""

    def end_headers(self):
        # Disable caching so you always see your latest changes
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else "?"
        colour = ANSI_GREEN if str(status).startswith("2") else ANSI_GREY
        print(
            f"  {ANSI_GREY}{self.address_string()}{ANSI_RESET}"
            f"  {colour}{fmt % args}{ANSI_RESET}"
        )

    def log_error(self, fmt, *args):
        pass  # suppress 404s etc. from cluttering the terminal


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")


def main():
    os.chdir(ROOT)

    print()
    print(f"  {ANSI_BOLD}{ANSI_PURPLE}<CT/>{ANSI_RESET}  {ANSI_BOLD}CheemaTech Dev Server{ANSI_RESET}")
    print(f"  {'─' * 34}")
    print(f"  {ANSI_CYAN}Local{ANSI_RESET}   →  http://localhost:{PORT}")
    print(f"  {ANSI_GREY}Root{ANSI_RESET}    →  {ROOT}")
    print()
    print(f"  {ANSI_GREY}Press Ctrl+C to stop{ANSI_RESET}")
    print()

    # Open browser after a short delay (gives the server time to start)
    Timer(0.8, open_browser).start()

    with socketserver.TCPServer(("", PORT), DevHandler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n  {ANSI_GREY}Server stopped.{ANSI_RESET}\n")


if __name__ == "__main__":
    main()
