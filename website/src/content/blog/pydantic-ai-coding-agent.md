---
title: "Claude Agent SDK Coding Powers in Pydantic AI"
date: 2026-11-04
categories: ["Pydantic AI", "Coding Agents"]
---

At a conference, I heard someone say they moved from Pydantic AI to the Claude Agent SDK because it had more
"coding" capabilities: reading files, editing them, running commands.

That was true of a bare `Agent`. It is not true of Pydantic AI today. The coding tools live in
[Pydantic AI Harness](https://pydantic.dev/docs/ai/harness/), and you add them in one line.

## A coding agent in one line

Install the harness with the `coder` extra:

```bash
uv add "pydantic-ai-harness[coder,anthropic]"
```

Then give an agent a workspace and the `Coder` capability:

```python
from pydantic_ai import Agent
from pydantic_ai.capabilities import LocalWorkspace
from pydantic_ai_harness.coder import Coder

agent = Agent(
    'anthropic:claude-sonnet-5-5',
    capabilities=[LocalWorkspace('.'), Coder()],
)
result = agent.run_sync('Run the tests with `uv run pytest`, and fix the bug they catch.')
print(result.output)
```

`LocalWorkspace('.')` is where the agent works: the current directory on your machine. `Coder()` gives it the tools
you know from Claude Code:

| Tool | What it does |
|---|---|
| `read_file` | Read a file, paged by line offset |
| `write_file` | Create or replace a file |
| `edit_file` | Exact string replacements, all or nothing |
| `list_files` | List files with ripgrep, respecting `.gitignore` |
| `grep` | Search file contents with ripgrep |
| `shell` | Run any command, including long-running ones like servers |
| `delegate_task` | Hand a self-contained sub-task to a fresh run of the same agent |

It also loads `AGENTS.md` and `CLAUDE.md` from the repository, clears old tool results when the context fills up, and
turns on prompt caching.

I ran this on a small project with a broken `slugify()` function. The agent ran the tests, read the failure, rewrote
the function with a regex, ran the tests again, and told me the edge case it chose not to handle.

## Feature by feature

Here is what you reach for in the Claude Agent SDK, and the Pydantic AI equivalent:

| Claude Agent SDK | Pydantic AI |
|---|---|
| `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash` | [`Coder`](https://pydantic.dev/docs/ai/harness/coder/), or [`FileSystem`](https://pydantic.dev/docs/ai/harness/filesystem/) and [`Shell`](https://pydantic.dev/docs/ai/harness/shell/) on their own |
| `CLAUDE.md` via `setting_sources` | [`RepoContext`](https://pydantic.dev/docs/ai/harness/repo-context/), included in `Coder` |
| Hooks like `PreToolUse` | [`Hooks`](https://pydantic.dev/docs/ai/hooks/) |
| `allowed_tools`, `can_use_tool` | [`Shell(allowed_commands=...)`](https://pydantic.dev/docs/ai/harness/shell/), [tool approval](https://pydantic.dev/docs/ai/deferred-tools/) |
| Subagents | [`SubAgents`](https://pydantic.dev/docs/ai/harness/subagents/) |
| Skills | [`Skills`](https://pydantic.dev/docs/ai/harness/skills/) |
| `TodoWrite` | [`Planning`](https://pydantic.dev/docs/ai/harness/planning/) |
| MCP servers | [`MCP`](https://pydantic.dev/docs/ai/capabilities/mcp/) |
| `WebSearch`, `WebFetch` | [`WebSearch`](https://pydantic.dev/docs/ai/capabilities/web-search/), [`WebFetch`](https://pydantic.dev/docs/ai/capabilities/web-fetch/) |
| Automatic compaction | [`Compaction`](https://pydantic.dev/docs/ai/harness/compaction/) |
| Resuming a session | `message_history=result.all_messages()` |

Each row is a capability: a unit of behaviour you add to `capabilities=[...]`. `Coder` is itself a bundle of
`FileSystem`, `Shell`, `RepoContext`, `SubAgents` and the context management ones, so you can take it apart when you
need a different setting.

## Hooks and planning

This is the agent I tested, with a plan the model keeps up to date and a hook that stops it from pushing:

```python
from pydantic_ai import Agent, RunContext, ToolDefinition
from pydantic_ai.capabilities import Hooks, LocalWorkspace, ValidatedToolArgs
from pydantic_ai.exceptions import ModelRetry
from pydantic_ai.messages import ToolCallPart
from pydantic_ai_harness import Planning
from pydantic_ai_harness.coder import Coder

hooks = Hooks()


@hooks.on.before_tool_execute(tools=['shell'])
async def block_git_push(
    ctx: RunContext, *, call: ToolCallPart, tool_def: ToolDefinition, args: ValidatedToolArgs
) -> ValidatedToolArgs:
    if 'git push' in args['command']:
        raise ModelRetry('Pushing is not allowed. Leave the changes uncommitted.')
    return args


agent = Agent(
    'anthropic:claude-sonnet-5-5',
    capabilities=[LocalWorkspace('.'), Coder(), Planning(), hooks],
)
result = agent.run_sync('Run the tests with `uv run pytest`, and fix the bug they catch.')
print(result.output)
```

`before_tool_execute` runs after the arguments are validated and before the tool runs. Raising `ModelRetry` sends
the message back to the model instead of running the command. That is the same job a `PreToolUse` hook does in the
Claude Agent SDK.

:::warning[A string check is not a security boundary]
The hook catches the model asking for `git push`. It does not stop a command that pushes some other way. For
untrusted work, run the agent in a sandbox.
:::

## Run it in a sandbox

`LocalWorkspace` runs commands as you, on your machine. Swap it for a sandbox and nothing else changes:

```python
from pydantic_ai import Agent
from pydantic_ai_harness.coder import Coder
from pydantic_ai_harness.docker_sandbox import DockerSandbox

agent = Agent('anthropic:claude-sonnet-5-5', capabilities=[DockerSandbox(image='python:3.13-slim'), Coder()])
result = agent.run_sync('Write a script that prints the first 10 primes, and run it.')
print(result.output)
```

The harness ships Docker, a local microVM with [smolvm](https://pydantic.dev/docs/ai/harness/smol-sandbox/), and
cloud sandboxes on Modal, E2B, Daytona and Fly.io Sprites.

## What you keep with Pydantic AI

The coding tools were the gap. The rest is why you picked Pydantic AI in the first place:

- **Any model.** Change `'anthropic:claude-sonnet-5-5'` to an OpenAI, Gemini or local model, and the same tools work.
- **Typed output.** Pass `output_type=` and the agent returns a validated Pydantic model, not a string you parse.
- **It is a Python library.** The agent loop runs in your process. There is no CLI subprocess to install and manage.
- **Durable execution.** Runs can survive restarts with
  [Temporal, DBOS, Prefect and others](https://pydantic.dev/docs/ai/durable_execution/overview/).
- **Observability.** `logfire.instrument_pydantic_ai()` traces every model call and tool call, with cost.

If the Claude Agent SDK fits your project, use it. But if "Pydantic AI can't code" is the reason you left, it can
now. Start with the [Coder docs](https://pydantic.dev/docs/ai/harness/coder/).
