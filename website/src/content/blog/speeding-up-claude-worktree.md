---
title: "Speeding up claude --worktree"
date: 2026-08-18
categories: ["Git", "Claude Code"]
---

I use `claude --worktree` a lot. It creates a fresh git worktree for the session, which means I can have several
Claude Code sessions running on the same repository without them stepping on each other.

It got slow. My assumption was "it's git's fault, the monorepo is big". I was half right, and the half I was wrong
about turned out to be the more interesting one.

## Measure first, guess later

The first thing I did was time the operation I was blaming:

```bash
time git worktree add --detach /tmp/bench HEAD
```

2.8 seconds. For 11,260 files that is not great, but it is nowhere near the delay I was feeling. So the checkout
was not the story, at least not yet.

I timed a few more things, and this is where it got weird:

| command | time |
|---|---|
| `git status` | 2.9s |
| `git log --oneline -2000` | 7.4s |
| `git fetch origin main` | 21.9s |

`git log --oneline -2000` has no business taking 7 seconds. It walks 2000 commits and prints one line each. On a
healthy repository that is about 40 milliseconds. Something was wrong with the repository itself, not with any
particular command.

## 15,787 packfiles

Here is what I found in `.git`:

```
packfiles:      15,787
loose objects:  78,741
refs:            5,893
.git size:        2.4G
```

Fifteen thousand packfiles. Every single object lookup has to consult every pack index, so every git command was
paying that cost, including the ones `claude --worktree` runs.

The cause was one line in `.git/config`:

```ini
[gc]
    auto = 0
```

Auto-gc was off. Every `git fetch` writes a new packfile, and normally auto-gc consolidates them once they pile up.
With `gc.auto=0` nothing ever did, so roughly fifteen thousand fetches left roughly fifteen thousand packs behind.
The commit-graph was eleven months stale for the same reason.

The fix is a repack:

```bash
git repack -adk
git commit-graph write --reachable
```

`-a` packs everything into one pack, `-d` deletes the now redundant packs, and `-k` keeps unreachable objects so
nothing is pruned. It is non-destructive, which matters when you have dropped commits sitting in reflogs you might
still want.

:::warning
Do not add `--write-midx` when the repository has thousands of packs. I tried
`git repack -adk --write-midx --write-bitmap-index` first and got `multi-pack-index died of signal 11`. Because the
crash happened before the `-d` step, none of the redundant packs were deleted, so `.git` ended up **bigger** than
when I started, plus a stale 20MB `multi-pack-index.lock` that would have blocked any future midx write. Repack
first, write the midx afterwards if you still want one.
:::

The results:

| | before | after |
|---|---|---|
| packfiles | 15,787 | 2 |
| loose objects | 78,741 | 0 |
| `.git` size | 2.4G | 992M |
| `git status` | 2.9s | 0.10s |
| `git log --oneline -2000` | 7.4s | 0.043s |
| `git fetch origin main` | 21.9s | 0.26s CPU |

That is a 170x on `git log`. Not a micro-optimization.

## Keeping it that way

Repacking once fixes nothing long term, because the packs come back. Rather than turning `gc.auto` back on, I used
git's own scheduler:

```bash
git maintenance start
```

This registers the repository and installs scheduled jobs (launchd on macOS, systemd or cron elsewhere). It runs
`prefetch` and `commit-graph` hourly, and `loose-objects` plus `incremental-repack` daily. It also sets
`maintenance.auto=false`, which means `gc.auto=0` is now the *correct* setting: foreground git commands stay out of
the way and the scheduler does the consolidation.

I also turned on two caches:

```bash
git config core.untrackedCache true
git config core.fsmonitor true
```

I was suspicious of `fsmonitor`, because it spawns a daemon per worktree and I have a lot of worktrees. So I
measured it on a freshly created worktree, where the daemon is cold and has to start from scratch: 0.106s with it
versus 0.173s without. Still a win even in the worst case, so it stayed on.

## My benchmark was lying to me

At this point `claude --worktree` had gone from 27.9s to 15.6s in my benchmark, and I wanted to know where the
remaining 15 seconds went.

The problem is that I had been measuring like this:

```bash
time claude -w my-worktree -p "reply with the single word OK"
```

That includes a full model round trip. It is a fine way to compare *before and after* a change, since both runs pay
the same model cost and the delta is real. It is a terrible way to answer "how long until I can type", because
interactively you never wait for that.

What I actually wanted was time-to-prompt. So I ran Claude Code under a pty and recorded when the prompt box
rendered:

```python
import os, pty, select, subprocess, time

BORDER = "─" * 20
start = time.time()
master, slave = pty.openpty()
env = dict(os.environ, TERM="xterm-256color", COLUMNS="120", LINES="40")
p = subprocess.Popen(["claude", "-w", "probe"], stdin=slave, stdout=slave, stderr=slave, env=env)
os.close(slave)

buf = b""
while time.time() - start < 60:
    r, _, _ = select.select([master], [], [], 0.25)
    if not r:
        continue
    buf += os.read(master, 65536)
    if buf.decode("utf8", "replace").count(BORDER) >= 2:
        print(f"time-to-prompt: {time.time() - start:.2f}s")
        break
```

The answer was 2.1 seconds, not 15. And plain `claude` with no worktree was 0.9 seconds, so the worktree itself was
costing about 1.2 seconds.

The timeline is worth showing, because it explains the illusion:

| t | what happened |
|---|---|
| 0.93s | prompt box rendered, I can type |
| 2.66s | MCP authentication warning appeared |
| 10.70s | status line finally appeared |

The status line showing up at 10.7 seconds looks damning, but the script itself runs in 0.15s. Claude Code just gets
to it after everything else has settled, long after the prompt is usable. If I had trusted the feeling instead of
the timeline, I would have spent an afternoon optimizing a shell script that was never the problem.

## Tracing what git actually runs

To find the remaining 1.2 seconds I put a fake `git` in front of the real one on `PATH`, logging every call and how
long it took:

```bash
#!/bin/bash
S=$(python3 -c 'import time; print(time.time())')
/usr/bin/git "$@"
RC=$?
python3 -c "
import sys, time
print(f'{time.time() - float(sys.argv[1]):7.3f}s  git ' + ' '.join(sys.argv[2:]),
      file=open('/tmp/git-trace.log', 'a'))
" "$S" "$@"
exit $RC
```

Then I launched `claude -w` with that directory first on `PATH`. Twelve git calls, 2.03 seconds total:

| call | time |
|---|---|
| `git worktree add --no-track -B ... origin/main` | 1.157s |
| `git status --short` | 0.460s |
| ten other calls | 0.42s |

So it is the checkout after all. Just not for the reason I assumed at the start.

Two things stood out. First, there is **no `git fetch` in the trace at all**. Claude Code branches from
`origin/main`, and the hourly `prefetch` job I set up earlier keeps `origin/main` current, so it finds it fresh and
skips the network entirely. The scheduled maintenance removed a cost I had not even set out to remove.

Second, `checkout.workers` was unset.

## Parallel checkout

Git can check files out in parallel, but it does not by default. `checkout.workers` defaults to 1. My machine has 16
cores and was writing 11,260 files on a single thread.

```bash
git config --global checkout.workers 4
git config --global checkout.thresholdForParallelism 100
```

Here is what each value gives, best of three runs:

| `checkout.workers` | time |
|---|---|
| 1 (the default) | 1.186s |
| **4** | **0.692s** |
| 8 | 0.790s |
| 16 | 1.246s |
| 0 (auto, = 16 here) | 1.114s |

1.71x at four workers. Note that the obvious setting is the wrong one: `0` means "use every core", and on this
machine that is *slower than serial*, as is an explicit 16. Past roughly four threads the I/O contention costs more
than the parallelism buys. If I had set it to `0` and walked away I would have made things worse and never known.

`thresholdForParallelism` is there so small repositories, under 100 files, stay serial and skip the worker setup.
That makes the global setting safe to apply everywhere.

## Where it ended up

Time-to-prompt for `claude --worktree`:

| | |
|---|---|
| after the repack | ~2.1s |
| after `checkout.workers=4` | **~1.7s** |

I only started measuring time-to-prompt after the repack, so I cannot honestly put a starting number in that table.
What I can say is that every git command the launch runs got between 8x and 170x faster, and the benchmark that does
include the model round trip went from 27.9s to 15.6s across the same change.

What remains is about a second of Claude Code's own startup and 0.7s of checkout. To go meaningfully below that I
would have to stop checking out 11,260 files per worktree, which means sparse-checkout scoped to the services a
session touches. That is a real option for a monorepo, but it changes what is on disk in every worktree, so I have
not pulled that trigger yet.

## While I was in there: worktrees pile up

One side effect of using `claude --worktree` constantly is that you accumulate worktrees. I had 133 of them, taking
125GB.

You cannot just delete them, because some have work in them. So I wrote a small script that classifies each one and
only removes the ones that are provably safe. A worktree is safe to delete when all of these hold:

- `git status --porcelain` is empty, so nothing uncommitted or untracked
- `git rev-list --count <branch> --not --remotes` is 0, so every commit exists on some remote
- it is not locked, and not the current worktree
- it has been idle longer than a threshold

That last one has a trap in it. The obvious way to measure "idle" is the directory's mtime, but a stray build or a
tool touching a file makes an abandoned worktree look active. I use the newest mtime across *tracked* files instead.

It found 48 worktrees that were clean, fully pushed and stale, and reclaimed 27GB. It also refused to touch 46
worktrees holding 79GB, because they had commits that existed on no remote. That number is the actually useful
output: the disk was not full of junk, it was full of work I had forgotten to push.

I run it weekly from a scheduled job now.

## What I would tell myself at the start

1. **Measure the thing you are blaming before you optimize it.** `git worktree add` was 2.8s of a much larger
   problem, and the repository-wide symptom (`git log` taking 7 seconds) was the thread worth pulling.
2. **Check your benchmark measures what you wait for.** `-p` mode includes a model round trip. It was fine for
   comparing before and after, and completely wrong as an absolute number.
3. **The obvious value of a tuning knob is not always the right one.** `checkout.workers=0` sounds like the answer
   and is slower than the default.

None of this is specific to Claude Code. Any tool that creates worktrees, or just any large repository where someone
turned off auto-gc years ago, is paying the same tax.

If you have other ideas about what would be interesting to share, let me know on [LinkedIn] or [Twitter].

[LinkedIn]: https://linkedin.com/in/marcelotryle
[Twitter]: https://x.com/marcelotryle
