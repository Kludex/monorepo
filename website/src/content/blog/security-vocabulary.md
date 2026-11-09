---
title: "Security Vocabulary for Maintainers"
date: 2026-11-09
categories: ["Open Source", "Security"]
---

"I've received a CVE." I hear this from maintainers all the time. It's wrong.

You don't receive a CVE. You receive a **report**. You turn it into an **advisory**. Then you **request** a CVE ID
from a **CNA**, which is usually GitHub, but doesn't have to be.

"We released several CVEs" is wrong too. It sounds like you shipped vulnerabilities. You release versions with the
fixes, and you publish advisories. The CNA publishes the CVE Records, unless you're a CNA yourself.

If those sentences have words you're not sure about, this post is for you.

## The short version

| Term | What it is | Example |
| --- | --- | --- |
| Vulnerability | A bug with security impact. | The `Host` header bypass in Starlette. |
| Report | The private message that tells you about a vulnerability. | A private vulnerability report on GitHub. |
| Advisory | The public document that describes the vulnerability, who is affected, and how to fix it. | [GHSA-86qp-5c8j-p5mr](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr) |
| CVE ID | A unique identifier for one vulnerability. | CVE-2026-48710 |
| CVE Record | The public entry behind a CVE ID, in the CVE database. | [CVE-2026-48710 on cve.org](https://www.cve.org/CVERecord?id=CVE-2026-48710) |
| CNA | An organization allowed to assign CVE IDs, within a scope. | GitHub, Red Hat, the Python Software Foundation. |
| Root | An organization that recruits, trains, and governs CNAs. | Red Hat, MITRE. |

The rest of the post explains each one, in the order you meet them as a maintainer.

## Report

A **vulnerability report** is how you find out. Someone found a bug with security impact, and tells you privately.

On GitHub, this is a [private vulnerability report](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).
The reporter opens the **Security** tab of your repository and clicks **Report a vulnerability**. Only the
maintainers and the reporter can see it.

A report is a claim, not a fact. Your first job is to validate it. Most reports I get are not valid.

## Advisory

A **security advisory** is the document you publish once the vulnerability is confirmed and fixed. It says what
the vulnerability is, which versions are affected, which versions fix it, and what users should do.

On GitHub, a private vulnerability report becomes a draft advisory once you accept it. You edit it with the reporter, invite
collaborators, and work on the fix in a temporary private fork. When the fix is released, you publish the
advisory.

Every GitHub advisory gets a **GHSA ID**, like `GHSA-86qp-5c8j-p5mr`. That ID belongs to GitHub's
[Advisory Database](https://github.com/advisories). It is not a CVE ID.

:::tip[An advisory doesn't need a CVE]
You can publish an advisory without ever requesting a CVE ID. But most scanners, Dependabot included, and most
security teams track vulnerabilities by CVE ID. If you want your users to be alerted, request one.
:::

## CVE

**CVE** stands for Common Vulnerabilities and Exposures. It's a program, run by [MITRE](https://www.mitre.org/) and funded by [CISA](https://www.cisa.gov/), that gives
each publicly known vulnerability a unique ID.

People use "CVE" for two different things:

- **CVE ID**: the identifier, like `CVE-2026-48710`. The year usually says when the ID was reserved, not when the bug was found.
- **CVE Record**: the public entry behind the ID, with the description, affected versions, and references.

A CVE ID has a state:

| State | Meaning |
| --- | --- |
| Reserved | A CNA assigned the ID, but the details are still private. |
| Published | The CVE Record is public. |
| Rejected | The ID should not be used, for example because it's a duplicate or not a vulnerability. |

So the precise sentence is: "I requested a CVE ID for my advisory, and it was published when I disclosed."

## CNA

A **CNA**, or CVE Numbering Authority, is an organization authorized by the CVE Program to assign CVE IDs and
publish CVE Records. Each CNA has a **scope**: the products it's allowed to assign IDs for.

Some CNAs you may know:

| CNA | Scope, roughly |
| --- | --- |
| GitHub | CVEs requested by code owners through GitHub Security Advisories. |
| Python Software Foundation | CPython, pip, and the Pallets projects, like Flask and Jinja. |
| curl | curl, libcurl, and trurl. |
| Red Hat | Open source projects affecting Red Hat software, not covered by a more specific CNA. |
| MITRE | Everything not covered by any other CNA. This is the "CNA of Last Resort". |

When you click **Request CVE** on a GitHub draft advisory, you're asking GitHub, as a CNA, to assign an ID. GitHub
reviews the advisory, reserves the ID, and publishes the CVE Record when you publish the advisory.

That's exactly what happened with BadHost in Starlette. GitHub reserved `CVE-2026-48710` on May 22, and published it
on May 26, when I published [the advisory](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr).

:::note[GitHub is not the only path]
If your project is in the scope of another CNA, that CNA assigns the ID. If a project has its own CNA, like curl or
the PSF, reporters must go through it. Nobody else can assign a CVE ID for it.
:::

## Root

A **Root** is an organization that recruits, trains, and governs CNAs. Every CNA reports to a Root, or directly to a
Top-Level Root: MITRE or CISA.

You only care about Roots when you want to become a CNA. Red Hat runs the Root recommended for open source projects.
curl, for example, is a CNA under Red Hat.

## Other words you will see

- **NVD**: the National Vulnerability Database, run by NIST. It mirrors CVE Records and adds data on top, like
  severity scores. It is not where CVE IDs come from.
- **CVSS**: the Common Vulnerability Scoring System. A score from 0 to 10, and a vector string that explains it,
  like `CVSS:3.1/AV:N/AC:L/...`.
- **CWE**: the Common Weakness Enumeration. The *kind* of bug, like CWE-79 for cross-site scripting.
- **Coordinated disclosure**: the reporter and the maintainer agree to keep the vulnerability private until a fix
  is released.
- **Embargo**: the period during which the vulnerability is kept private.
- **OSV**: [Open Source Vulnerabilities](https://osv.dev/), a database and format that aggregates advisories per
  ecosystem, like PyPI or npm.

## How to become a CNA

You don't need to become a CNA to get CVE IDs for your project. GitHub covers most open source projects already.

You become a CNA when you want to own the process:

- **You write the CVE Records.** Third-party records can be incomplete or wrong.
- **Reporters come to you first.** For a project in your scope, the CVE ID request goes through you, so you get to
  weigh in before an ID exists.
- **You don't share embargoed details with anyone else** to get an ID.

The cost is a commitment. You must answer CVE disputes within days, and stay active, or you're removed.

Seth Larson went through this for the Python Software Foundation, and turned his notes into
[a guide for open source projects](https://github.com/ossf/wg-vulnerability-disclosures/blob/main/docs/guides/becoming-a-cna-as-an-open-source-org-or-project.md).
It covers the requirements, the steps, and the questions you will have. Start with
[his announcement on the OpenSSF blog](https://openssf.org/blog/2023/11/27/openssf-introduces-guide-to-becoming-a-cve-numbering-authority-as-an-open-source-project/).

:::info[I'm applying]
I'm going through this for Starlette, python-multipart, Uvicorn, and Mangum. My scope and disclosure policy are on
the [CVE coordination](/cna) page.
:::
