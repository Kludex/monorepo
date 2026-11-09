# Social posts

Posts for X and LinkedIn live in `social/`. Every new file that lands on `main` is sent to Buffer, which publishes it immediately or at the scheduled time.

```
social/twitter/starlette-1-8-0.txt
social/linkedin/starlette-1-8-0.txt
```

## Rules

- **Always write both files**, with the same file name. Use a short kebab-case slug of the topic.
- **Always open a pull request. Never push a post to `main`.** CI comments a preview of each post on the pull request, and merging is the approval. A published post cannot be edited from here.
- **Read the source first.** For a release, read the release notes with `gh release view`. Every claim in the post must come from the source.
- **1 or 2 emojis per post.** Not zero, not three. Put them where they carry meaning, such as the announcement line, not on every bullet.
- **Plain text only.** Neither network renders Markdown, so no backticks, no `**bold**`, no `[text](url)` links. Write `Request.send_early_hints()` bare.
- **No em dashes or en dashes.** Use `-`.
- **No hashtags.**
- **Put the link in the first comment, not in the post.** Use the full URL. See First comment below.

## Voice

Write as Marcelo, in first person, as a maintainer talking to other developers.

- Lead with the news. The first line says what happened.
- Be specific. Name the feature, the method, the version. Concrete details beat enthusiasm.
- Short, plain sentences.
- Avoid "excited to announce", "thrilled", "game-changer", "leverage", and questions that fish for engagement.

## X

- **280 characters is a hard limit.** A URL always counts as 23, an emoji counts as 2. Check the length before you finish.
- One announcement line, then the body in one of the formats below.

## LinkedIn

- Keep it under 1300 characters.
- One announcement line, then the body in one of the formats below.
- It can cover more than the X post, but it is not a changelog. Pick what a user would care about.

## Formats

Vary the format from post to post, so engagement can be compared across formats. Never use the same one twice in a row in a series.

| Format | Shape |
| --- | --- |
| Classic | Announcement, a short paragraph, then 3-4 bullets. |
| Story | Short paragraphs that tell what happened, no bullets. |
| Numbers | Open with a measured result, such as "40,000 tokens, then 4,580", then explain it. |
| Quote | Open with a real output, error or question in quotes, then explain it. |
| Problem, fix, result | Short paragraphs that start with "The problem:", "The fix:" and "The result:". |
| Minimal | One or two sentences. Let the image carry the rest. |

## Scheduling

A post is published when the pull request is merged. To schedule it instead, make the first line `at:` with an ISO 8601 time, then a blank line, then the post.

```
at: 2026-10-20T15:00+02:00

Starlette 1.8.0 is out!
```

- Only schedule when the user asks for a time. Always include the UTC offset the user means.
- Use the same `at:` line in both files unless the user wants different times.

## First comment

To add a first comment, put it after a `---` line at the end of the post. LinkedIn posts it as the first comment, X as a reply. The comment follows the same rules as the post, except that a comment with only the link needs no emoji. On X it has its own 280 character limit.

## Images

Put an image next to the text file with the same name, such as `starlette-1-8-0.png`. Use `starlette-1-8-0.1.png` and `starlette-1-8-0.2.png` for several. An image used on both networks must be copied into both directories.

For a code snippet, render it with `node website/scripts/snippet.mjs snippet.py image.png`. Never hand-roll the highlighting. The script rejects snippets longer than 22 lines or wider than 90 columns, because they render too small to read. Show the part the post is about, not the whole script, but keep everything it needs to run, such as a workspace. Run the exact file you render, not a longer version of it.

Add `--pydantic` to put the Pydantic logo in the top right corner. Only use it when the post exists to promote Pydantic, such as a Pydantic AI, Logfire, or Monty feature. Never use it when the post promotes a personal project, such as pgtask, zuvloop, Starlette, Uvicorn, or HTTPX2, even if the project uses Pydantic AI.
