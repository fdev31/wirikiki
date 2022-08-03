#!/bin/env python

PORT = 8000
HOST = "127.0.0.1"


def run():
    import os

    pid = os.fork()

    if pid > 0:  # main process, launch browser
        import time

        try:
            import native_web_app as webbrowser
        except ImportError:
            import webbrowser

        time.sleep(1)
        webbrowser.open(f"http://{HOST}:{PORT}")
    else:  # daemon (children) process
        import sys
        import uvicorn

        try:
            from setproctitle import setproctitle
        except ImportError:
            pass
        else:
            setproctitle(sys.argv[0])
        os.setsid()  # detach
        uvicorn.run("wirikiki:app", host=HOST, port=PORT, log_level="warning")


if __name__ == "__main__":
    run()
