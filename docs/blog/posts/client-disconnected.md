---
date: 2024-06-06
categories:
- FastAPI
- Starlette
- Uvicorn
- Client Disconnect
readtime: 5
---

# Understanding client disconnection in FastAPI

This blog post will give you a comprehensive understanding how FastAPI works when the client disconnects.

!!! info
    If you want to try the code I'll be presenting, you'll need to have some packages installed:

    ```bash
    pip install httpx fastapi uvicorn httptools uvloop
    ```

    - `httpx` is going to be used as the HTTP client.
    - `uvicorn` is the ASGI server, and `httptools` and `uvloop` are packages used by `uvicorn`.
    - You know about `fastapi`... But it's an ASGI web framework.

## A Simple Request

Let's create a FastAPI application with an endpoint that takes a long time to finish its processing.

The following endpoint just sleeps for 10 seconds, and sends a response with a 204 status code:

```py title="main.py"
from fastapi import FastAPI, Request

app = FastAPI()


@app.get("/", status_code=204)
async def home() -> None:
    await anyio.sleep(10)
```

You can run this application with any ASGI server. We'll use Uvicorn because I maintain it,
and it's the most popular ASGI server.

Let's run it with `uvicorn main:app --reload --log-level=trace`.

!!! tip
    The `--log-level=trace` is used to see ASGI messages, and changes in the connection status.

Let's call this endpoint with an HTTP client, and disconnect before the server is able to send the response back.

```py title="client.py"
import anyio
import httpx

async def main() -> None:
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        with anyio.fail_after(1):
            await client.get("/")

if __name__ == "__main__":
    anyio.run(main)
```

If you run the above with `python client.py`, you'll see the following logs on the **server side**:

```bash
TRACE:    127.0.0.1:50953 - HTTP connection made
TRACE:    127.0.0.1:50953 - ASGI [2] Started scope={'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'server': ('127.0.0.1', 8000), 'client': ('127.0.0.1', 50953), 'scheme': 'http', 'root_path': '', 'headers': '<...>', 'state': {}, 'method': 'GET', 'path': '/', 'raw_path': b'/', 'query_string': b''}
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.request', 'body': '<0 bytes>', 'more_body': False}
TRACE:    127.0.0.1:50953 - HTTP connection lost
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.disconnect'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.start', 'status': 204, 'headers': '<...>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.body', 'body': '<0 bytes>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Completed
```

This may look a bit too complex, so let's go step by step here...

The first two lines show that the client connected to the server, and that the ASGI application was called.

```bash hl_lines="1-2"
TRACE:    127.0.0.1:50953 - HTTP connection made
TRACE:    127.0.0.1:50953 - ASGI [2] Started scope={'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'server': ('127.0.0.1', 8000), 'client': ('127.0.0.1', 50953), 'scheme': 'http', 'root_path': '', 'headers': '<...>', 'state': {}, 'method': 'GET', 'path': '/', 'raw_path': b'/', 'query_string': b''}
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.request', 'body': '<0 bytes>', 'more_body': False}
TRACE:    127.0.0.1:50953 - HTTP connection lost
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.disconnect'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.start', 'status': 204, 'headers': '<...>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.body', 'body': '<0 bytes>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Completed
```

!!! info
    The ASGI specification determines how the server and the web framework are going to interact to process the client's request.

When the server reads the body, it will send a `http.request` ASGI message to the ASGI application (in this case, FastAPI):

```bash hl_lines="3"
TRACE:    127.0.0.1:50953 - HTTP connection made
TRACE:    127.0.0.1:50953 - ASGI [2] Started scope={'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'server': ('127.0.0.1', 8000), 'client': ('127.0.0.1', 50953), 'scheme': 'http', 'root_path': '', 'headers': '<...>', 'state': {}, 'method': 'GET', 'path': '/', 'raw_path': b'/', 'query_string': b''}
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.request', 'body': '<0 bytes>', 'more_body': False}
TRACE:    127.0.0.1:50953 - HTTP connection lost
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.disconnect'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.start', 'status': 204, 'headers': '<...>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.body', 'body': '<0 bytes>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Completed
```

Then... Before the application finishes the execution, the client disconnected!

```bash hl_lines="4"
TRACE:    127.0.0.1:50953 - HTTP connection made
TRACE:    127.0.0.1:50953 - ASGI [2] Started scope={'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'server': ('127.0.0.1', 8000), 'client': ('127.0.0.1', 50953), 'scheme': 'http', 'root_path': '', 'headers': '<...>', 'state': {}, 'method': 'GET', 'path': '/', 'raw_path': b'/', 'query_string': b''}
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.request', 'body': '<0 bytes>', 'more_body': False}
TRACE:    127.0.0.1:50953 - HTTP connection lost
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.disconnect'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.start', 'status': 204, 'headers': '<...>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.body', 'body': '<0 bytes>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Completed
```

The server notices, and sends a `http.disconnect` message to the application.

```bash hl_lines="5"
TRACE:    127.0.0.1:50953 - HTTP connection made
TRACE:    127.0.0.1:50953 - ASGI [2] Started scope={'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'server': ('127.0.0.1', 8000), 'client': ('127.0.0.1', 50953), 'scheme': 'http', 'root_path': '', 'headers': '<...>', 'state': {}, 'method': 'GET', 'path': '/', 'raw_path': b'/', 'query_string': b''}
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.request', 'body': '<0 bytes>', 'more_body': False}
TRACE:    127.0.0.1:50953 - HTTP connection lost
TRACE:    127.0.0.1:50953 - ASGI [2] Receive {'type': 'http.disconnect'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.start', 'status': 204, 'headers': '<...>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Send {'type': 'http.response.body', 'body': '<0 bytes>'}
TRACE:    127.0.0.1:50953 - ASGI [2] Completed
```

Ok... Cool! Now we finally arrive to the important point of this blog post!

The client disconnected, the ASGI server communicated it to the application, but... Did the application stop?

The answer is: **NO**. Although the application is able to check the `http.disconnect`, Starlette only does it for
`StreamingResponses`, but it doesn't do it for all the other response classes by default.

## Check Client Disconnection

I said above that the application is able to check, but it doesn't do it by default.

I'll teach you how you can check when a client is disconnected.

!!! note
    The current way to check client disconnection is a bit complicated. But... We are working on new mechanism that
    will be introduce in a future release with the goal of simplifying this flow.

    Follow me on [LinkedIn] and [Twitter], and [sponsor me on GitHub] for more information. :eyes:

Let's complicate a bit our application... I'll explain everything, don't worry.

```py title="main.py"
from fastapi import FastAPI, Request
import anyio
import httpx

app = FastAPI()


async def disconnected(request: Request, cancel_scope: anyio.CancelScope) -> None:
    while True:
        message = await request.receive()
        if message["type"] == "http.disconnect":
            cancel_scope.cancel()
            break


@app.get("/", status_code=204)
async def home(request: Request) -> None:
    async with anyio.create_task_group() as tg:
        tg.start_soon(disconnected, request, tg.cancel_scope)
        await anyio.sleep(10)
```

Cool! But... What have I done? :sweat_smile:

We've created the `disconnected()` task, that will _await_ on `request.receive()`, and cancel the
`anyio.TaskGroup` when the message `"http.disconnect"` is found.

Is the logic above 100% correct? When I was writing this article, I actually thought it was, but then I remembered
that I forgot a small detail... What if the client doesn't disconnect?

Well... Then the task runs forever. So yeah, we need to actually need to either stop the `TaskClient` when:
1. the client disconnects or...
2. the endpoint finishes to process its logic, and is ready to send the response.

The right logic is a bit more complex, but would be...

```py title="main.py"
from typing import Any, Awaitable

import anyio
import httpx
from fastapi import FastAPI, Request

app = FastAPI()

async def disconnected(request: Request) -> None:
    while True:
        message = await request.receive()
        if message["type"] == "http.disconnect":
            break  # (1)!


async def wrap(call: Awaitable[Any], cancel_scope: anyio.CancelScope):
    await call
    cancel_scope.cancel()  # (2)!


@app.get("/", status_code=204)
async def home(request: Request) -> None:
    async with anyio.create_task_group() as tg:
        tg.start_soon(wrap, disconnected(request), tg.cancel_scope)
        await wrap(anyio.sleep(5), tg.cancel_scope)
```

1. We removed the `cancel_scope.cancel()` from here.
2. We added the `cancel_scope.cancel()` in the `wrap()` function.

Now, we achieving our goal. You can try calling the `python client.py`, and you'll see it will work.
You can also call the endpoint with a simple `curl http://localhost:8000/` (without disconnecting).

After seeing all of the above, you may have some questions...

### Is this necessary?

I don't recommend to do it in most of cases. I'm just presenting a behavior, and explaining how to overcome it
with the current mechanisms that are available.

### Is this the best way to do this?

For now, yes. As I said above, we are working on a new mechanism to detect if the client has disconnected.

## What about WebSockets?

If there's curiosity, I'll write a blog post about it as well. There are some sutil (but important) differences.

## Conclusion

If you learned something useful with this blog post, consider [sponsor me on GitHub], and/or share this
blog post among your colleagues.

If you have more ideas about what would be interesting to share, feel free to let me know on [LinkedIn] or [Twitter].

[sponsor me on Github]: https://github.com/sponsors/Kludex
[LinkedIn]: https://linkedin.com/in/marcelotryle
[Twitter]: https://x.com/marcelotryle
