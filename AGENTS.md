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
- **Put the link on its own last line.** Use the full URL.
- **No first comments or replies.** Buffer needs a paid plan for them, so CI fails a post with a `---` line.

## Voice

Write as Marcelo, in first person, as a maintainer talking to other developers.

- Lead with the news. The first line says what happened.
- Be specific. Name the feature, the method, the version. Concrete details beat enthusiasm.
- Short, plain sentences.
- Avoid "excited to announce", "thrilled", "game-changer", "leverage", and questions that fish for engagement.

## X

- **280 characters is a hard limit.** A URL always counts as 23, an emoji counts as 2. Check the length before you finish.
- One announcement line, then up to 4 short bullets with `-`, then the link.

## LinkedIn

- Keep it under 1300 characters.
- One announcement line, a short paragraph on the most important change and why it matters, then a few bullets for the rest.
- It can cover more than the X post, but it is not a changelog. Pick what a user would care about.

## Scheduling

A post is published when the pull request is merged. To schedule it instead, make the first line `at:` with an ISO 8601 time, then a blank line, then the post.

```
at: 2026-10-20T15:00+02:00

Starlette 1.8.0 is out!
```

- Only schedule when the user asks for a time. Always include the UTC offset the user means.
- Use the same `at:` line in both files unless the user wants different times.

## Images

Put an image next to the text file with the same name, such as `starlette-1-8-0.png`. Use `starlette-1-8-0.1.png` and `starlette-1-8-0.2.png` for several. An image used on both networks must be copied into both directories.
