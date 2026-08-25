---
date: 2026-08-25
categories:
- Testing
---

# Why I Enforce 100% Test Coverage

Every project I maintain runs with `fail_under = 100`. Not 95%. Not 99%. 100%.

That sounds dogmatic, so let me explain why anything less doesn't work.

## 95% seems good, right?

95% is a percentage. Percentages hide absolute numbers.

Say your project has 10,000 lines and 95% coverage. That is 500 untested lines. Two years later the project has
40,000 lines, coverage is still a comfortable 95%, and CI is green. You now have 2,000 untested lines. The metric
stayed flat while your blind spot quadrupled.

Worse: nobody knows *which* 500 lines are the untested ones. Is it dead code? A critical error branch? The retry
logic that only fires in production? A percentage below 100 tells you "some lines are untested" without telling you
which ones, and every new PR gets to quietly add a few more.

At 100%, the question inverts. Every uncovered line is either tested or carries an explicit pragma that states why it
is excluded. The blind spot is not a growing anonymous pool - it is a reviewable, greppable list.

## Guardrails matter more in the AI era

I write a lot of code with agents now. You probably do too.

An agent working on a codebase with 100% coverage cannot silently break behavior. If it changes a line, a test
exercises that line. If it adds a line, CI fails until the line is covered. The coverage gate turns "I hope the agent
didn't break anything" into "the agent physically cannot merge untested code".

This is the same reason strict typing pays off with agents: the tighter the guardrails, the more autonomy you can
safely give. A 95% gate lets an agent land its changes inside the uncovered 5% - exactly the code you can least
afford to have touched blindly.

## High level tests are the rule

100% coverage does not mean a unit test per function. It means every line is *reached* by a test, and the tests that
reach them should go through the public API - an HTTP request, a CLI invocation, a parser fed raw bytes.

Never test private functions or private objects. Tests pinned to internals make refactoring expensive: you cannot
change the shape of the code without rewriting the suite. They also make the code harder to read - every private
helper now has a second home in the test suite that you have to keep in sync. A test should fail because behavior
broke, never because a function moved or was renamed.

When a line is hard to reach, escalate in order:

1. Reach it with different **input** through the public API.
2. Inject the failure at the **boundary** - a failing allocator, an erroring transport, a cassette recording a 500.
   Most "untestable" error branches are this case.
3. Only if it is genuinely untriggerable, exclude it with a pragma **that states why**.

Exceptions for specific parts of the system are fine - a hairy parser might deserve focused tests on its own module.
But that module then gets a public API. If a private function feels like it needs its own test, it wants to be its
own module.

## Starting from a clean state

When I start a new project - or adopt 100% coverage on an existing one - the first thing I do is establish a "clean
coverage" state.

I don't write tests for every existing gap upfront. I mark every currently uncovered line with a dedicated pragma:

```python
def _handle_rare_edge(self) -> None:  # pragma: full coverage
    ...
```

Note that it is `pragma: full coverage`, not the usual `pragma: no cover`. The distinction matters:

- `pragma: no cover` means "deliberately excluded, with a reason".
- `pragma: full coverage` means "excluded in the initial batch to reach the 100% gate - this is debt".

Both are registered as exclusion patterns:

```toml
[tool.coverage.report]
fail_under = 100
exclude_lines = [
    "pragma: no cover",
    "pragma: full coverage",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

From that moment, the gate is live. No new untested line can enter the codebase, and the remaining debt is one
`grep "pragma: full coverage"` away. You burn it down over time; new code never adds to it.

## Summary

- A percentage below 100 means your untested line count grows forever, anonymously.
- 100% coverage is a guardrail that lets you trust agents (and humans) with more autonomy.
- Reach lines through the public API. Never test private functions - it taxes every future refactor.
- Bootstrap with `pragma: full coverage` so the gate is live from day one and the debt stays visible.
