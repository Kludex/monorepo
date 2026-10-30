## How to publish to X and LinkedIn?

Add one plain text file per network. The file content is the post.

```
social/twitter/starlette-1-0.txt
social/linkedin/starlette-1-0.txt
```

Open a pull request. CI comments a preview of each new post, with the character count for X, and fails if an X post is over 280 characters. Merging is the approval.

When the commit lands on `main`, CI publishes every new file through [Buffer](https://buffer.com), after the website deploy, so links to a new blog post already resolve.

To schedule a post instead of publishing it on merge, start the file with an `at:` line:

```
at: 2026-10-20T15:00+02:00

Starlette 1.8.0 is out!
```

The time is ISO 8601. Without an offset it is UTC. Merging hands the post to Buffer, which publishes it at that time, and you can still edit or cancel it there. CI fails the pull request if the time is invalid or already in the past.

To add a first comment, put it after a `---` line:

```
Monty is a Python interpreter in Rust.

---

If you want to work on Monty, apply here:
https://pydantic.dev/jobs/senior-rust-engineer-monty
```

On LinkedIn it is the first comment. X has no first comment, so it is posted as a reply instead.

To attach images, put them next to the text file with the same name: `starlette-1-0.png`, or `starlette-1-0.1.png` and `starlette-1-0.2.png` for several. Buffer downloads them from the public repository.

To turn a code snippet into an image with the Pydantic colours:

```bash
node website/scripts/snippet.mjs snippet.py social/twitter/httpx2.png
```

Add `--pydantic` to put the Pydantic logo in the top right corner:

```bash
node website/scripts/snippet.mjs --pydantic snippet.py social/twitter/pydantic-ai.png
```

The logo is off by default because most posts are about my own projects. Use it only for posts that promote Pydantic, such as Pydantic AI, Logfire, or Monty.

It highlights with Shiki and takes the screenshot with Google Chrome. Set `CHROME` if Chrome is not in `/Applications`.

The directory name is the Buffer service name of the channel. Only added files are published - editing or deleting a file does nothing.

!!! warning "Re-running a partially failed job posts twice"
    If one network fails and the other succeeds, a re-run publishes the successful one again. Publish the failed one by hand in Buffer instead.

It needs the `BUFFER_API_KEY` repository secret, created at <https://publish.buffer.com/settings/api>.

## How to run the slides?

```bash
npx @marp-team/marp-cli@4.0.0 --server docs/slides
```
