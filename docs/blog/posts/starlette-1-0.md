---
date: 2026-03-22
categories:
- Open Source
- Starlette
---

# Starlette 1.0 is here!

A few weeks after the [1.0.0rc1](https://starlette.dev/release-notes/#100rc1-february-23-2026) release,
we are ready to welcome the [long awaited 1.0](https://www.starlette.io/release-notes/#100). :tada:

Starlette 1.0 is not about reinventing the framework or introducing a wave of breaking changes. It is mostly a
stability and versioning milestone. The changes in 1.0 were limited to removing old deprecated code that had been on
the way out for years, along with a few bug fixes. From now on we'll follow [SemVer](https://semver.org/) strictly.

## Acknowledgement

Before we continue, I'd like to thank the people that helped shape the project into what it is today.

**First and foremost**, thank you to [Mia Kimberly Christie](https://github.com/lovelydinosaur) for creating Starlette! :pray:

Over the years, many people have shaped this project.
[Thomas Grainger](https://github.com/graingert) and [Alex Gronholm](https://github.com/agronholm) taught me so much about async Python, and have always been ready to help and mentor me along the way.
[Adrian Garcia Badaracco](https://github.com/adriangb), one of the smartest people I know, who I have the pleasure of working with at Pydantic.
[Aber Sheeran](https://github.com/abersheeran) has been my go-to person when I need help on many subjects.
[Florimond Manca](https://github.com/florimondmanca) was always present in the early days of both Starlette and Uvicorn, and helped a lot in the ecosystem.
[Amin Alaee](https://github.com/aminalaee) contributed a lot with file-related PRs,
and [Alex Oleshkevich](https://github.com/alex-oleshkevich) helped on templates and many discussions.
[Sebastián Ramírez](https://github.com/tiangolo) maintains FastAPI upstream, and has always been in contact to help with upstream issues.
[Jordan Speicher](https://github.com/uSpike) worked on making Starlette anyio compatible.

On the support side, [Seth Michael Larson](https://github.com/sethmlarson) has been someone I've relied on for help with security vulnerabilities,
and [Pydantic](https://pydantic.dev/), my company, has supported me in maintaining these open source projects.
A special thanks to our sponsors as well: [@tiangolo](https://github.com/tiangolo),
[@huggingface](https://github.com/huggingface), and [@elevenlabs](https://github.com/elevenlabs).

## Starlette in the last year

Since the [2024 Open Source Report](open-source-2024.md), here's what happened
(data gathered from the [GitHub API](https://docs.github.com/en/rest) and [PyPI Stats](https://pypistats.org/packages/starlette)):

| Downloads/month | Releases | Closed issues | Merged PRs | Closed unmerged PRs | Answered discussions |
|-----------------|----------|---------------|------------|---------------------|----------------------|
| [325 million](https://pypistats.org/packages/starlette) | 19 | 50 | 144 | 77 | 49 |

Compared to last year (57 million downloads/month), Starlette has grown to **325 million downloads/month** -
almost 6x growth!

## Open Source in the Age of AI

A lot of my work at [Pydantic](https://pydantic.dev/) lately, building [Logfire](https://pydantic.dev/logfire),
has been focused on AI, and that has influenced my day-to-day work quite a bit, including how I maintain Starlette.

In practice, that has mostly meant using coding agents to speed up issue triage and pull request review.

The most negative side lately has been the amount of issues, pull requests and advisories opened
via coding agents, that are just noise. Issues and pull requests are easy to close, but
advisories are tricky - sometimes they look real, and making a judgement usually takes a
long time.

## What's next?

Looking ahead, we'll probably focus on improving the performance of our routing and multipart parsing. The number of issues in
Starlette is down to 15 lately, so the idea is to keep maintaining the project as is. We'll be following SemVer now,
and I don't foresee version 2 any time soon, but I'm also not afraid of doing that if we introduce some cool
breaking change.

Go ahead and bump your Starlette version, and if you'd like to support the continued development of Starlette,
consider [sponsoring me on GitHub](https://github.com/sponsors/Kludex). :heart:

Oh, and Sebastián, Starlette is now out of your way to release FastAPI 1.0. :wink:
