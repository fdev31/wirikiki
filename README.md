# Installation

```
sh ./makevueApps.sh
npm install
DIST=1 ./node_modules/.bin/rollup -c rollup.config.js
```

# Usage

1. Download a dist file (_TODO - no release yet_) or type `make dist` after downloading the project.
1. execute `run.sh`

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
