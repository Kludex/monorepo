---
title: "Your gh Token Can Turn Off Your Branch Protection"
date: 2026-10-22
categories: ["Security", "GitHub"]
---

Yesterday, LiteLLM published [a security incident report](https://docs.litellm.ai/blog/security-incident-oct-21-2026).
The attacker got hold of GitHub CLI OAuth tokens from logs. One of them belonged to an organization owner. They
used it to disable branch protections, force push, and release a malicious package to PyPI.

The token that `gh auth login` gives you can do the same on every repository you administer. And you can fix that
in five minutes.

## Why the default token is so powerful

`gh auth login` creates a classic OAuth token. Its minimum scopes are `repo`, `read:org` and `gist`. GitHub
describes `repo` as "full access to public and private repositories". On a repository where you are an admin, that
token is an admin too.

So whoever holds it can:

- Disable branch protection and rulesets.
- Remove protection rules from deployment environments, or let admins bypass them.
- Change which actions may run, and the default permissions of `GITHUB_TOKEN`.
- Add collaborators and deploy keys.

That token lives on your machine, and any tool that runs `gh` in your shell can use it. That includes
coding agents. In the LiteLLM case, the report says Claude Code embedded the token in a response body, and the
response ended up in logs.

## Fine-grained tokens split the dangerous part out

Fine-grained personal access tokens have a permission called **Administration**. Every endpoint in the list above
requires it. Releases, pull requests, issues and pushes don't.

So you can have a token that does all your daily work, and still can't touch the settings that protect your
releases.

I found this while building [release-gate](https://github.com/Kludex/release-gate), a GitHub App that asks for a
passkey before a release job can run. The obvious attack against it is not to break it, but to remove it from the
environment. With a classic token, that is one API call.

## Switch your token

Create a fine-grained token at
[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):

- **Resource owner:** your account, or your organization.
- **Repository access:** All repositories.
- **Read and write:** Contents, Pull requests, Issues, Workflows and Actions.
- **Administration:** leave it off.

Then point `gh` at it. `git` goes through `gh` if you use it as the credential helper, so it switches too:

```bash
gh auth logout
gh auth login --with-token < token.txt && rm token.txt
gh auth status
```

`gh auth status` should show a token starting with `github_pat_`.

## Revoke the old one

`gh auth logout` does not revoke anything. Its help says so: "This command does not revoke authentication tokens."
If the old token was ever copied somewhere, it still works.

- Go to [github.com/settings/applications](https://github.com/settings/applications), find **GitHub CLI**, and
  click **Revoke**.
- Go to [github.com/settings/tokens](https://github.com/settings/tokens) and delete the classic tokens you don't use.

## Check that it worked

I tested it on a sandbox repository, by trying to remove the deployment protection rule and to enable admin bypass:

```bash
gh api -X DELETE repos/Kludex/release-gate-sandbox/environments/gated/deployment_protection_rules/1
gh api -X PUT repos/Kludex/release-gate-sandbox/environments/gated -F can_admins_bypass=true
```

Both returned:

```
Resource not accessible by personal access token (HTTP 403)
```

Pushing, opening pull requests, re-running workflows and `gh release create` kept working.

## What you give up

Fine-grained tokens are not a drop-in replacement. GitHub lists
[the limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens-limitations).
These are the ones you will notice:

- A token covers one user or one organization, not several.
- It can't contribute to repositories where you are an outside collaborator.
- Organizations can require an owner to approve the token first.

For settings changes, use the browser. It is slower on purpose.

This doesn't make you safe from everything. Malware that steals your browser session can still change settings.
But a leaked CLI token can no longer turn off the controls that protect your users.
