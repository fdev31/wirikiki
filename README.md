_Wirikiki_ aims at being a productivity oriented **markdown notebook**.
It's compatible with the most common features supported by GitHub's markdown and adds a few other.

In comparison to [Jupyter](https://jupyter.org/) it lacks the python notes but brings:

- speed / light footprint
- simplicity of use
- more advanced markdown support via [markItDown](https://markitdown.netlify.app/) and plugins
- auto archival (via git)

# Installation

## Building

3 alternatives way to get a runnable code:

- download a release (TODO)
- `make dist`
- manual installation

```
sh ./makevueApps.sh
npm install
DIST=1 ./node_modules/.bin/rollup -c rollup.config.js
```

# Usage

Just execute `run.sh`, it will automatically install the python virtual environment

## Keyboard shortcuts

| Key            | Description                                     |
| -------------- | ----------------------------------------------- |
| **Escape**     | Close editor or modal, else toggles the sidebar |
| **Del**        | **D**elete current page                         |
| **E**          | **E**dit current note                           |
| **F**          | Search/**F**ind something                       |
| **N**          | **C**reate a new note                           |
| **Left/Right** | Switch to previous/next note                    |

# Advanced usage

Basic git support is provided, to enable it just type `git init` in the `myKB` folder.

```shell
cd myKB
git init
```

# Dependencies

- **Python 3**
  - if you want to run it **without the virtualenv** you will need the following python packages:
    - aiofiles
    - fastapi
    - uvicorn
- nodejs and npm (BUILD ONLY)
- inotify-tools (DEV ONLY)
