__all__ = ["gitRun", "gitSave", "gitAdd", "gitRemove"]

import asyncio

from .configuration import cfg, PATH


async def gitRun(*args):
    if not cfg["database"]["use_git"]:
        return
    cmd_args = ["git", f"--git-dir={PATH}.git", f"--work-tree={PATH}"]
    cmd_args.extend(args)
    proc = await asyncio.create_subprocess_exec(*cmd_args)
    await proc.communicate()


async def gitSave(path, message="backup"):
    await gitRun("commit", path + ".md", "-m", message)


async def gitAdd(path):
    await gitRun("add", path + ".md")


async def gitRemove(path):
    if path.endswith("/index"):
        # it is a folder (or index file)
        # remove the index file
        await gitRun("rm", "-f", path + ".md")
        # try to remove the folder as well, recursively
        folder_path = path[:-6]  # remove /index
        if folder_path:  # safety check
            await gitRun("rm", "-r", "-f", folder_path)
    else:
        await gitRun("rm", "-f", path + ".md")
