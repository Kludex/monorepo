---
date: 2022-09-13
categories:
- Testing
links:
  - Starlette's TestClient: https://www.starlette.io/testclient/
  - FastAPI Testing Tutorial: https://fastapi.tiangolo.com/tutorial/testing/
readtime: 5
---

# FastAPI's Test Client

This is my **first** blog post! :partying_face:

Please *enjoy*, and let me know if you have any **feedback**. :nerd:

!!! abstract
    If you are new to **FastAPI**, you might benefit from reading the following:

    - [`TestClient` origin and features](#testclient-origin-and-features)
    - [The `TestClient` *weird* behavior](#the-testclient-weird-behavior)

    If you already know stuff about **FastAPI**, you might jump to:

    - [The Future of the `TestClient`](#the-future-of-the-testclient)


Today, we'll talk about the main tool for testing **FastAPI** applications: the `TestClient`.

## `TestClient` origin and features

The **`TestClient`** is a feature from [**Starlette**](https://www.starlette.io/)
(one of the two main dependencies of FastAPI). On which, **FastAPI** only does a reimport on the `testclient` module,
as we can see [here](https://github.com/tiangolo/fastapi/blob/b2aa3593be300b57973987fb2489ed01ed9c9f68/fastapi/testclient.py#L1).

We can use the **`TestClient`** to test our [*WebSocket*](https://www.starlette.io/testclient/#testing-websocket-sessions)
and [*HTTP*](https://www.starlette.io/testclient/) endpoints.

## The `TestClient` *weird* behavior

Although documented on both [FastAPI](https://fastapi.tiangolo.com/advanced/testing-events/) and
[Starlette](https://www.starlette.io/events/#running-event-handlers-in-tests)'s documentation, most
of the people are not aware of the **`TestClient`**'s behavior when it comes to *events*. To put it simple,
there are two ways of creating a `TestClient` object, and in one of those ways, the *events* are not
executed.

Let's see the behavior with the following **FastAPI** application:

```py linenums="1" title="main.py"
from fastapi import FastAPI

app = FastAPI()
started = False

@app.on_event("startup") # (1)!
def startup():
    global started
    started = True

@app.get("/")
def home():
    if started:
        return {"message": "STARTED"}
    else:
        return {"message": "NOT STARTED"}
```

1. There are only two events available: **startup** and **shutdown**.

    Read more about it on the [**ASGI documentation**](https://asgi.readthedocs.io/en/latest/specs/lifespan.html).

As you can see, there's a single endpoint, which gives us a different message depending on the value of the `started` variable.
The `started` variable is set to `True` on the `startup` event.

Now, let's test it with the `TestClient`:

=== "Code"

    ```py linenums="1" hl_lines="9" title="test.py"
    from fastapi.testclient import TestClient

    from main import app

    def test_home():
        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "NOT STARTED"}
    ```

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install "fastapi[all]" pytest
    ```

    Then run `pytest`:
    ```bash
    pytest test.py
    ```

---

As you can see, the above test **passes**. Which means the `startup` event was **not** triggered. :scream:

On the other hand, if we run the following test, we'll get a different result:

=== "Code"

    ```py linenums="1" hl_lines="9" title="test.py"
    from fastapi.testclient import TestClient

    from main import app

    def test_home():
        with TestClient(app):
            response = client.get("/")
            assert response.status_code == 200
            assert response.json() == {"message": "STARTED"}
    ```

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install "fastapi[all]" pytest
    ```

    Then run `pytest`:
    ```bash
    pytest test.py
    ```

---

When used as [context manager](https://docs.python.org/3/reference/datamodel.html#context-managers),
the `TestClient` will trigger the `startup` event.

## The Future of the `TestClient`

By the moment I'm writing this blog, the latest **FastAPI** version is `0.83.0` with **Starlette** pinned on `0.19.1`.
**Starlette** is already on version `0.20.3`, and the next release will change the internals of the `TestClient`. To be
more specific, the HTTP client will be changed from `requests` to `httpx`.

As there are some differences between the two clients, the `TestClient` will reflect the same differences.

This change will be in **Starlette** on version `0.21.0`, and I'm unsure when it will land on **FastAPI**.

Let's see the changes you should be aware:

1. `allow_redirects` will be now called `follow_redirects`.
2. `cookies` parameter will be deprecated under method calls (it should be used on the client instantiation).
3. `data` parameter will be called `content` when sending bytes or text.
4. `content_type` will default to "text/plain" when sending file instead of empty string.
5. The HTTP methods *DELETE*, *GET*, *HEAD* and *OPTIONS* will not accept `content`, `data`, `json` and `files` parameters.
6. `data` parameter doesn't accept list of tuples, instead it should be a dictionary.

    === "❌ List of Tuples"

        ```python
        client.post(..., data=[("key1", "1"), ("key1", "2"), ("key2", "3")])
        ```

    === "✅ Dictionary"

        ```python
        client.post(..., data={"key1": ["1", "2"], "key2": "3"})
        ```

Those changes will likely impact your test suite. Having this in mind, I've created a [*codemod*](https://libcst.readthedocs.io/en/latest/codemods_tutorial.html) that will help you to migrate your tests: [**bump-testclient**](https://github.com/Kludex/bump-testclient). :tada:

Here is the list of what the *codemod* will do:

1. Replace `allow_redirects` with `follow_redirects`.
2. Replace `data` with `content` when sending bytes or text.
3. Replace `client.<method>(..., <parameter>=...)` by `client.request("<method>", ..., <parameter>=...)` when parameter is either
   `content`, `data`, `json` or `files`.

In case you want to read more about the differences between the underneath clients, you can check
the [httpx documentation](https://www.python-httpx.org/compatibility/).

Thanks for reading till here! :nerd_face:
