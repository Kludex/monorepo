---
title: CVE Coordination
description: Responsible vulnerability reporting, coordinated disclosure, and proposed CNA scope for open-source projects maintained or coordinated by Marcelo Trylesinski.
image: assets/cna/cve-coordination.png
hide:
  - toc
---

<section class="cna-hero">
  <div class="cna-hero__content">
    <span class="cna-eyebrow">Security &amp; CVE coordination</span>
    <h1>Open-source security, handled responsibly.</h1>
    <p>I coordinate vulnerability reports for open-source infrastructure used across the Python ecosystem. This page is the public home for reporting, disclosure, advisories, and my proposed CVE Numbering Authority scope.</p>
    <div class="cna-actions">
      <a class="md-button md-button--primary" href="mailto:marcelotryle@gmail.com?subject=Private%20security%20report">Report privately</a>
      <a class="md-button" href="#proposed-cna-scope">View CNA scope</a>
    </div>
  </div>
  <aside class="cna-status" aria-label="CNA application status">
    <span class="cna-status__signal"></span>
    <span class="cna-status__label">Application status</span>
    <strong>Prospective CNA</strong>
    <p>Public materials prepared for CVE Program onboarding.</p>
  </aside>
</section>

!!! info "Not yet a CVE Numbering Authority"
    I am preparing a CNA application. I will only reserve, assign, or publish CVE IDs after the CVE Program authorizes me to do so. Until then, I coordinate with an appropriate existing CNA.

<div class="cna-section-heading" markdown>
## Proposed CNA scope

The scope is intentionally specific: clear enough to prevent overlapping assignments, but flexible enough to support maintainers who explicitly ask for help.
</div>

<div class="cna-scope-statement" markdown>
### Scope statement

Vulnerabilities in the open-source projects listed below when I am an authorized maintainer or security coordinator; and vulnerabilities in other open-source projects that I research or coordinate when an authorized project representative explicitly requests my assistance, provided the vulnerability is not already covered by another CNA with more appropriate scope.

Supported and end-of-life releases are considered case by case. I will defer to the supplier or another CNA whenever it has more appropriate scope.
</div>

<div class="cna-project-grid">
  <a class="cna-project" href="https://github.com/Kludex/starlette">
    <span class="cna-project__index">01</span><strong>Starlette</strong><small>ASGI framework</small>
  </a>
  <a class="cna-project" href="https://github.com/Kludex/python-multipart">
    <span class="cna-project__index">02</span><strong>python-multipart</strong><small>Multipart parser</small>
  </a>
  <a class="cna-project" href="https://github.com/Kludex/uvicorn">
    <span class="cna-project__index">03</span><strong>Uvicorn</strong><small>ASGI server</small>
  </a>
  <a class="cna-project" href="https://github.com/pydantic/pydantic">
    <span class="cna-project__index">04</span><strong>Pydantic</strong><small>Data validation</small>
  </a>
  <a class="cna-project" href="https://github.com/pydantic/pydantic-ai">
    <span class="cna-project__index">05</span><strong>Pydantic AI</strong><small>Agent framework</small>
  </a>
  <a class="cna-project" href="https://github.com/modelcontextprotocol/modelcontextprotocol">
    <span class="cna-project__index">06</span><strong>MCP</strong><small>Protocol &amp; Python SDK</small>
  </a>
  <div class="cna-project">
    <span class="cna-project__index">07</span><strong>Magnum</strong><small>Open-source project</small>
  </div>
  <a class="cna-project" href="https://github.com/pydantic/httpx2">
    <span class="cna-project__index">08</span><strong>HTTPX2</strong><small>HTTP client</small>
  </a>
</div>

<p class="cna-caption">This list describes the proposed starting scope. The approved scope may change during onboarding and will be kept current here.</p>

## Report a vulnerability

Please report suspected vulnerabilities privately. For a repository that has private vulnerability reporting enabled, its **Security** tab is the best route because it keeps discussion next to the affected code. Otherwise, email me.

<div class="cna-report-card">
  <div>
    <h3>Private contact</h3>
    <p><strong><a href="mailto:marcelotryle@gmail.com?subject=Private%20security%20report">marcelotryle@gmail.com</a></strong></p>
    <p>Use the subject <code>Private security report: &lt;project&gt;</code>. Do not open a public issue before we have agreed on disclosure.</p>
  </div>
  <div class="cna-report-card__meta">
    <p><strong>Initial response</strong><br>Within 3 business days</p>
    <p><strong>Triage update</strong><br>Within 7 calendar days</p>
  </div>
</div>

### What to include

- The affected project, component, and version or commit.
- A clear description of the security impact and realistic attack scenario.
- Reproduction steps or a minimal proof of concept.
- Any known mitigations, patches, or disclosure constraints.
- Your preferred name and credit, or a request to remain anonymous.

Please avoid sending real user data, credentials, or secrets. Use synthetic test data whenever possible.

## Vulnerability disclosure policy

My goal is to protect users while treating reporters and maintainers fairly. Open-source projects rarely have a dedicated security team, so timelines are coordinated around impact, exploitation risk, patch complexity, release capacity, and downstream adoption.

<div class="cna-policy-grid" markdown>
<div markdown>
### 1. Receive &amp; acknowledge

I will acknowledge a complete private report within three business days and establish a private coordination channel.
</div>
<div markdown>
### 2. Validate &amp; scope

I will reproduce the issue, assess affected versions and impact, check for duplicates, and identify the CNA with the most appropriate scope.
</div>
<div markdown>
### 3. Fix &amp; coordinate

We will agree on a disclosure plan with the reporter and maintainers. The usual target is no later than 90 days, but may be shorter for active exploitation or adjusted when user safety requires it.
</div>
<div markdown>
### 4. Publish &amp; credit

A fix should be available before or at disclosure whenever feasible. The advisory will include affected and fixed versions, mitigations, impact, references, and reporter credit where requested.
</div>
</div>

### Embargo and confidentiality

Information shared under embargo is limited to people needed to validate, fix, release, and notify affected downstreams. I will not use a report for publicity or share identifying information without permission, except where necessary to protect users or comply with law.

### CVE assignment principles

- Assign only within the approved CNA scope and only after CNA authorization.
- Give the supplier or CNA with the most appropriate scope the first opportunity to assign.
- Check for existing CVE records and coordinate to avoid duplicates.
- Create records that are specific, accurate, and useful to affected users.
- Publish or update the CVE record promptly when the advisory becomes public.
- Follow the current [CNA Operational Rules](https://www.cve.org/ResourcesSupport/AllResources/CNARules) when they differ from this page.

### Safe harbor

I welcome good-faith research that avoids privacy violations, service disruption, data destruction, persistence, and access beyond what is necessary to demonstrate impact. I will not pursue legal action for accidental, good-faith violations of this policy. This statement cannot bind third parties, but I will support responsible reporters who follow it.

## Public advisories

Advisories are public, require no login, and link to the affected project's canonical security notice.

<div class="cna-advisory" markdown>
<span class="cna-advisory__date">28 MAY 2026</span>

### [CVE-2026-48710 · Starlette request URL host validation](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr)

Malformed `Host` values could make a reconstructed request URL differ from the path used by routing. Fixed in Starlette 1.0.1. [Read the maintainer perspective](blog/posts/badhost-cve-2026-48710.md).
</div>

## Application readiness

<div class="cna-readiness">
  <div><span>01</span><strong>Public scope</strong><small>Defined above, including overlap and end-of-life handling.</small></div>
  <div><span>02</span><strong>Public contact</strong><small>A direct path for reporters and CVE Program communications.</small></div>
  <div><span>03</span><strong>Disclosure policy</strong><small>Embargo, timelines, assignment principles, and safe harbor.</small></div>
  <div><span>04</span><strong>Advisory location</strong><small>Public, permanent, and accessible without credentials.</small></div>
</div>

The proposed public identity is **Marcelo Trylesinski** with the short name **Kludex**, in the **Information Technology** industry and based in the **Netherlands**. I maintain Starlette and Uvicorn, contribute across the Pydantic ecosystem, and have experience triaging private reports, shipping security fixes, and publishing GitHub Security Advisories.

The exact Root, CNA role/type, annual allocation, and onboarding schedule will be agreed with the CVE Program during registration. The official [CNA onboarding resources](https://www.cve.org/ResourcesSupport/Resources#cnaOnboarding) and [CNA Operational Rules](https://www.cve.org/ResourcesSupport/AllResources/CNARules) govern the application.

<section class="cna-closing" markdown>
## Found something important?

Send it privately. You will get a human response, a fair technical review, and clear next steps.

[Start a private report](mailto:marcelotryle@gmail.com?subject=Private%20security%20report){ .md-button .md-button--primary }
</section>
