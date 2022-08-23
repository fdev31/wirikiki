#!/bin/env python
import os
import sys
import shutil

PORT = 8000
HOST = "127.0.0.1"
SIMPLE = os.environ.get('FG', False)

if len(sys.argv) > 1:
    if sys.argv[1] == "new":
        if len(sys.argv) > 2:
            from wirikiki.configuration import ROOT

            dst = sys.argv[2]
            shutil.copytree(os.path.join(ROOT, "config"), dst)
            for path in ("web", "myKB"):
                shutil.copytree(os.path.join(ROOT, path), os.path.join(dst, path))

            settings = os.path.join(dst, "settings.toml")
            data = open(settings).read()
            with open(settings, "w") as f:
                for line in data.split("\n"):
                    if line.startswith("base_dir"):
                        f.write("base_dir = %r\n" % os.path.join(os.getcwd(), dst))
                    else:
                        f.write(line + "\n")

            raise SystemExit(0)
        else:
            print("Syntax: %s %s <name>" % (os.path.basename(sys.argv[0]), sys.argv[1]))
            raise SystemExit(1)
    elif sys.argv[1] == "update":
        from wirikiki.configuration import ROOT
        shutil.rmtree("web")
        shutil.copytree(os.path.join(ROOT, "web"), "web")
        raise SystemExit(0)
    if sys.argv[1] == "help":
        print("""Possible options:

* new <name>
* update

Without arguments it will just run the wiki in the current folder.""")
        raise SystemExit(0)


def run():
    import os
    from wirikiki.configuration import USING_DEFAULTS

    if USING_DEFAULTS:
        print(
            "Can't find settings.toml in the current folder, set CFG_FILE in the environment and try again"
        )
        raise SystemExit(-1)

    pid = 0 if SIMPLE else os.fork()

    if pid > 0:  # main process, launch browser
        import time
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
        if not SIMPLE:
            os.setsid()  # detach
        uvicorn.run("wirikiki.routes:app", host=HOST, port=PORT, log_level="warning")


if __name__ == "__main__":
    run()
