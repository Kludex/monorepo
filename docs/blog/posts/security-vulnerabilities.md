---
date: 2026-05-23
categories:
- Open Source
- Security
- Starlette
- Uvicorn
---

# What it's like to be on the receiving end of security reports

I maintain [python-multipart](https://github.com/Kludex/python-multipart), [Uvicorn](https://github.com/encode/uvicorn),
and [Starlette](https://github.com/encode/starlette). Together they sit underneath a huge slice of the Python web
ecosystem - if you run FastAPI, you run all three. That position comes with a responsibility most people never see:
someone has to read every "I think I found a vulnerability" report, decide whether it's real, and fix it without
breaking the world.

This is a post about that side of the work - the triage, not the heroics.

<!-- more -->

## The numbers

Across the three projects, I've reviewed **59 security advisories** that reached a final decision:

| Project          | Published | Closed |
|------------------|:---------:|:------:|
| python-multipart |     5     |   15   |
| Uvicorn          |     0     |   12   |
| Starlette        |     6     |   21   |
| **Total**        |   **11**  | **48** |

The 11 published advisories are below, with links. The 48 closed ones I won't detail - they were duplicates, not
actually vulnerabilities, out of scope, or otherwise didn't warrant an advisory. I'm sharing the count because it's
the part of maintenance that stays invisible: for every CVE that ships, there are several reports that take real time
to read, reproduce, and rule out. (I'm also leaving out the reports still in triage.)

## The published advisories

### python-multipart

- [Content-Type Header ReDoS](https://github.com/Kludex/python-multipart/security/advisories/GHSA-2jv5-9r88-3w3p) - high
- [Denial of service via deformation `multipart/form-data` boundary](https://github.com/Kludex/python-multipart/security/advisories/GHSA-59g5-xgcq-4qw3) - CVE-2024-53981 - high
- [Arbitrary file write via a non-default configuration](https://github.com/Kludex/python-multipart/security/advisories/GHSA-wp53-j4wj-2cfg) - CVE-2026-24486 - high
- [Denial of service via large multipart preamble or epilogue data](https://github.com/Kludex/python-multipart/security/advisories/GHSA-mj87-hwqh-73pj) - CVE-2026-40347 - medium
- [Denial of service via unbounded multipart part headers](https://github.com/Kludex/python-multipart/security/advisories/GHSA-pp6c-gr5w-3c5g) - CVE-2026-42561 - high

### Starlette

- [Path traversal in `StaticFiles`](https://github.com/Kludex/starlette/security/advisories/GHSA-v5gw-mw7f-84px) - low
- [`MultipartParser` DoS with too many fields or files](https://github.com/Kludex/starlette/security/advisories/GHSA-74m5-2c7w-9w3x) - medium
- [Denial of service via `multipart/form-data`](https://github.com/Kludex/starlette/security/advisories/GHSA-f96h-pmfr-66vw) - CVE-2024-47874 - high
- [Denial of service when parsing large files in multipart forms](https://github.com/Kludex/starlette/security/advisories/GHSA-2c2j-9gv5-cj73) - CVE-2025-54121 - medium
- [O(n²) DoS via Range header merging in `FileResponse`](https://github.com/Kludex/starlette/security/advisories/GHSA-7f5h-v6xp-fcq8) - CVE-2025-62727 - high
- [Missing Host header validation poisons `request.url.path`](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr) - medium

### Uvicorn

None published - yet. That doesn't mean nothing comes in: Uvicorn accounts for 12 of those 48 closed reports. It's an
HTTP server, so it attracts a steady stream of request-smuggling and parsing-edge-case reports, and most of them turn
out to belong upstream or not to be exploitable in practice.

## What I've learned doing the triage

A few patterns repeat often enough to be worth writing down.

**Multipart is a magnet for DoS.** Look at the list: most of the published advisories are denial-of-service issues in
multipart parsing. Parsers that accept untrusted input and do unbounded work are where the bugs live, and the fix is
almost always "put a limit on the thing that had no limit."

**Most of the work is saying no.** Four out of five reports don't become advisories. Triaging them well - reproducing,
reasoning about the threat model, explaining the decision - is the bulk of the effort, and none of it shows up in a CVE
feed.

**A good report is a gift.** The ones that ship fastest come with a minimal reproduction, a clear threat model, and an
honest severity assessment. The ones that take longest are vague claims that I have to turn into a reproduction myself
before I can even decide if there's anything there.

If you're a maintainer staring at your first security report: it's normal for it to be noise, and it's normal for it to
take longer than the fix itself. If you're a reporter: the reproduction is the kindest thing you can include.
