---
title: "How to Override Part of AGENTS.md"
date: 2026-09-04
categories: ["AI", "Coding Agents", "Git"]
---

I wanted to change one paragraph in a project's `AGENTS.md` for my own coding-agent sessions.

The project says to run the entire test suite after every change. I prefer to run the smallest relevant subset first,
then run the complete suite before finalizing broad changes. I still want every other project instruction.

`AGENTS.override.md` sounds like the right file for this. It is not.

## The short answer

Use `AGENTS.local.md` as your private source of truth:

```text
project/
├── AGENTS.md
├── AGENTS.local.md
├── CLAUDE.local.md
└── .worktreeinclude
```

Put the personal exception in `AGENTS.local.md`:

```md
# Personal project instructions

## Testing override

The paragraph under `## Testing` in `AGENTS.md` beginning with
"Always run the entire test suite" is superseded for my sessions.

Run the smallest relevant test subset first. Run the complete suite when the
change is broad or before finalizing the work.

All other instructions in `AGENTS.md` remain in effect.
```

This is a **semantic override**. Both instructions may remain in the model's context, but the local file identifies
one rule and replaces it with a more specific rule.

That distinction matters because coding agents do not merge Markdown documents by heading or paragraph. There is no
standard patch format for instruction files.

## Why AGENTS.override.md does not work

Codex and pi check instruction filenames in a defined order. When `AGENTS.override.md` and `AGENTS.md` exist in the
same directory, they load `AGENTS.override.md` instead of `AGENTS.md`.

They do not concatenate the two files from that directory.

This makes `AGENTS.override.md` useful when you want to replace the whole instruction file temporarily. It is also
useful in a nested directory. A nested override can replace that directory's instructions while preserving an
`AGENTS.md` loaded from the repository root.

It does not work for a private paragraph-level exception at the repository root:

```text
project/
├── AGENTS.md           # Not loaded by Codex or pi at this level
└── AGENTS.override.md  # Loaded instead
```

You could copy the entire project file into `AGENTS.override.md` and edit one paragraph. That creates two problems:

- The private copy becomes stale when the project updates `AGENTS.md`.
- Review becomes harder because one personal exception is hidden inside a duplicated file.

The filename says "override", but its behavior is file replacement, not document patching.

Codex documents this as loading [at most one instruction file per directory][codex-agents]. Pi documents the same
selection behavior in its [context file discovery][pi-context].

## Describe the exception precisely

Do not write this:

```md
Ignore the testing instructions in AGENTS.md.
```

"Testing instructions" may refer to a heading, one paragraph, or every testing rule in the file. The instruction also
becomes dangerous when the project adds another rule later.

Name the heading and enough of the original text to identify the rule:

```md
The paragraph under `## Testing` in `AGENTS.md` beginning with
"Always run the entire test suite" does not apply to my sessions.

Replace it with:

Run the smallest relevant test subset first. Run the complete suite when the
change is broad or before finalizing the work.

All other instructions under `## Testing`, and all other sections of
`AGENTS.md`, remain in effect.
```

This gives the model a narrow conflict to resolve. It also makes the local file easy to audit after the project
changes its instructions.

:::warning
A semantic override is still an instruction to a model. It is not a parser removing text from the context. Keep the
replacement specific, short, and later than the shared instructions whenever the tool supports ordering.
:::

## Load it in Claude Code

Claude Code does not read `AGENTS.md` directly. It reads `CLAUDE.md` and `CLAUDE.local.md`, and it supports Markdown
imports with `@path`.

If the repository does not already have a `CLAUDE.md` that imports `AGENTS.md`, create this private
`CLAUDE.local.md`:

```md
@AGENTS.md
@AGENTS.local.md
```

Claude expands both files. It reads the shared instructions first and the personal exception second.

If the repository already has this committed bridge:

```md
@AGENTS.md
```

then your private `CLAUDE.local.md` only needs:

```md
@AGENTS.local.md
```

Claude loads `CLAUDE.local.md` after `CLAUDE.md` in the same directory. This is the cleanest implementation because
both documents are loaded automatically and the personal exception appears last. The behavior is documented under
[How CLAUDE.md files load][claude-memory].

## Load it in Codex without hooks

Codex has no native `AGENTS.local.md` filename and no import syntax for `AGENTS.md`. Its fallback filenames do not
help because Codex only checks them when `AGENTS.md` is missing.

Add this once to your global `~/.codex/AGENTS.md`:

```md
## Personal project overlays

At the start of a session in a Git repository, check whether
`AGENTS.local.md` exists at the repository root. If it exists, read it after
all project `AGENTS.md` files. Treat it as additional personal instructions.
An explicit replacement in `AGENTS.local.md` supersedes only the project rule
it identifies. All other project instructions remain in effect.
```

Codex loads the global file and the project's `AGENTS.md`. The global instruction then tells it to read the private
file without replacing the project file.

This is hook-free, but it has a tradeoff: Codex must perform a file read. The local file is not injected by Codex's
instruction-file discovery. If you need guaranteed injection rather than model-directed discovery, Codex does not
currently provide a hook-free, additive per-project instruction file.

## Load it in pi without an extension

Pi has the same limitation at the project level. It recognizes `AGENTS.override.md`, `AGENTS.md`, and `CLAUDE.md`, but
not `AGENTS.local.md`.

Add the same bootstrap instruction to `~/.pi/agent/AGENTS.md`:

```md
## Personal project overlays

At the start of a session in a Git repository, check whether
`AGENTS.local.md` exists at the repository root. If it exists, read it after
all project context files. Treat it as additional personal instructions.
An explicit replacement in `AGENTS.local.md` supersedes only the project rule
it identifies. All other project instructions remain in effect.
```

Pi loads its global `AGENTS.md` and the project's `AGENTS.md`. Like the Codex setup, this relies on the agent reading
the private file rather than native instruction discovery.

A pi extension can inject the file automatically with `before_agent_start`, but that changes the design. The workflow
here deliberately avoids hooks and extensions.

## Keep the files private

Use Git's repository-local exclusion file instead of changing the project's `.gitignore`:

```bash
exclude="$(git rev-parse --git-common-dir)/info/exclude"

touch "$exclude"
for path in /AGENTS.local.md /CLAUDE.local.md /.worktreeinclude; do
    grep -qxF "$path" "$exclude" || printf '%s\n' "$path" >> "$exclude"
done
```

`$GIT_COMMON_DIR/info/exclude` is shared by linked worktrees. The exclusions remain local to your clone and do not
create a project change for everyone else.

Check the result:

```bash
git status --short --ignored | grep -E 'AGENTS\.local|CLAUDE\.local|worktreeinclude'
```

You should see the files marked as ignored:

```text
!! .worktreeinclude
!! AGENTS.local.md
!! CLAUDE.local.md
```

## Copy the files into worktrees

Claude Code supports `.worktreeinclude` for copying ignored files into worktrees it creates. The file uses
`.gitignore` syntax, and matched files must already be ignored.

Create `.worktreeinclude` in the repository root:

```text
.worktreeinclude
AGENTS.local.md
CLAUDE.local.md
```

Including `.worktreeinclude` itself lets a copied worktree retain the same policy when it creates another worktree.
Claude documents this behavior under [Copy gitignored files into worktrees][claude-worktrees].

For a worktree created manually, copy the files yourself:

```bash
git worktree add -b my-feature ../project-my-feature
cp .worktreeinclude AGENTS.local.md CLAUDE.local.md ../project-my-feature/
```

At the time of writing, `.worktreeinclude` is documented by Claude Code. Codex's public CLI documentation does not
document it, and pi does not create worktrees itself. If another Codex surface copies these files, treat that as a
surface-specific feature and test it before depending on it.

## The resulting behavior

| Tool | Shared instructions | Personal instructions | How it works |
|---|---|---|---|
| Claude Code | `AGENTS.md` | `AGENTS.local.md` | `CLAUDE.local.md` imports both |
| Codex | `AGENTS.md` | `AGENTS.local.md` | Global `AGENTS.md` tells Codex to read it |
| pi | `AGENTS.md` | `AGENTS.local.md` | Global `AGENTS.md` tells pi to read it |

The source of truth for the exception remains one file: `AGENTS.local.md`.

`AGENTS.override.md` still has a place. Use it when you intend to replace one directory's complete instruction file,
or when a nested directory needs a different set of instructions. Do not use it when you want to preserve the file
next to it and change one paragraph.

## What I would choose

For a private, hook-free workflow, I would use:

1. A precise semantic exception in `AGENTS.local.md`.
2. `CLAUDE.local.md` imports for Claude Code.
3. One global bootstrap instruction for Codex and one for pi.
4. Git's local exclude file to keep the files private.
5. `.worktreeinclude` where the worktree creator documents support.

It is not a universal Markdown merge feature. It is a small convention built on the features each tool actually
provides. Most importantly, it preserves the project's instructions instead of freezing a private copy that will
silently become stale.

[codex-agents]: https://developers.openai.com/codex/guides/agents-md/#how-codex-discovers-guidance
[claude-memory]: https://code.claude.com/docs/en/memory#how-claudemd-files-load
[claude-worktrees]: https://code.claude.com/docs/en/worktrees#copy-gitignored-files-into-worktrees
[pi-context]: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md#context-files
