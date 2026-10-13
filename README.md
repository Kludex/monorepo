## How to publish to X and LinkedIn?

Add one plain text file per network. The file content is the post.

```
social/twitter/starlette-1-0.txt
social/linkedin/starlette-1-0.txt
```

Open a pull request. CI comments a preview of each new post, with the character count for X, and fails if an X post is over 280 characters. Merging is the approval.

When the commit lands on `main`, CI publishes every new file through [Buffer](https://buffer.com), after the website deploy, so links to a new blog post already resolve.

To attach images, put them next to the text file with the same name: `starlette-1-0.png`, or `starlette-1-0.1.png` and `starlette-1-0.2.png` for several. Buffer downloads them from the public repository.

The directory name is the Buffer service name of the channel. Only added files are published - editing or deleting a file does nothing.

!!! warning "Re-running a partially failed job posts twice"
    If one network fails and the other succeeds, a re-run publishes the successful one again. Publish the failed one by hand in Buffer instead.

It needs the `BUFFER_API_KEY` repository secret, created at <https://publish.buffer.com/settings/api>.

## How to run the slides?

```bash
npx @marp-team/marp-cli@4.0.0 --server docs/slides
```
