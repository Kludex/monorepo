---
date: 2023-03-14
categories:
- Testing
readtime: 3
---

# Contract Testing with HTTPX - Part 2

!!! note
    This is a continuation of [Contract Testing with HTTPX].

On the previous article, I used [RESPX] to call the service B from service A. Although it looks cool, we can actually
achieve the same goal without using anything besides [FastAPI] itself.

## The Services

Let's assume that we have _similar_ two services as presented in the previous article.

The difference here is that we'll be creating a dependency called `service_b_client`, which
is going to return a `httpx.AsyncClient` instance that calls our service B.

=== "Service A"

    ```py linenums="1" title="service_a.py"
    from typing import AsyncIterator

    import httpx
    from fastapi import APIRouter, Depends, FastAPI

    router = APIRouter(prefix="/a")


    async def service_b_client() -> AsyncIterator[httpx.AsyncClient]:
        async with httpx.AsyncClient(base_url="http://localhost:8000/b/") as client:
            yield client


    @router.get("/")
    def get_a():
        return {"a": "a"}


    @router.get("/call_b")
    async def call_b(client: httpx.AsyncClient = Depends(service_b_client)):
        response = await client.get("/")
        return response.json()


    app = FastAPI()
    app.include_router(router)

    if __name__ == "__main__":
        import uvicorn

        uvicorn.run(app, port=8001)  # (1)!
    ```

    1. The port is **8001**, not **8000**, to avoid conflicts with the other service.

=== "Service B"

    ```py linenums="1" title="service_b.py"
    from fastapi import APIRouter, FastAPI

    router = APIRouter(prefix="/b")


    @router.get("/")
    def get_b():
        return {"b": "b"}


    app = FastAPI()
    app.include_router(router)

    if __name__ == "__main__":
        import uvicorn

        uvicorn.run(app, port=8000)
    ```

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install uvicorn fastapi httpx
    ```

    Then open the terminal and run:

    ```bash
    python service_a.py
    ```

    Then open another terminal, and run:

    ```bash
    python service_b.py
    ```

---

Now, let's call the `/a/call_b` endpoint.

```bash
http :8001/a/call_b # (1)!
```

1. The HTTP client used is called [HTTPie], but you can use [`curl`],
    or just go to the browser, and access [`http://localhost:8001/a/call_b`](http://localhost:8001/a/call_b).

The response should look like:

```json
{
    "b": "b"
}
```

## Testing

Since the only difference between this article, and the previous one is the creation of the dependency on service A,
you might be guessing that we are going to [override the dependency], and... You are right! (if you didn't, is fine as well :sweat_smile:)

We are going to use `app.dependency_overrides` to override the `service_b_client` dependency, and instead of calling the real service B,
we'll _call the application itself_, avoiding the network calls that would potentially slow down our test suite.

=== "Test"

    ```py linenums="1" title="test.py"
    from typing import AsyncIterator

    import httpx
    import pytest

    from service_a import app, service_b_client
    from service_b import app as app_b


    async def service_b_client_override() -> AsyncIterator[httpx.AsyncClient]:
        async with httpx.AsyncClient(app=app_b, base_url="http://test/b") as client:
            yield client


    @pytest.fixture(name="client")
    async def testclient():
        app.dependency_overrides[service_b_client] = service_b_client_override
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            yield client


    @pytest.mark.anyio
    async def test_call_b(client: httpx.AsyncClient) -> None:
        response = await client.get("/a/call_b")
        assert response.status_code == 200
        assert response.json() == {"b": "b"}
    ```

    See more on the [Starlette documentation].

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install pytest httpx trio
    ```

    Then open the terminal and run:

    ```bash
    python -m pytest test.py
    ```

---

Good! Now are able to avoid a lot of network calls, and speed up our test suite. :tada:

[RESPX]: https://lundberg.github.io/respx/
[FastAPI]: https://fastapi.tiangolo.com/
[Contract Testing with HTTPX]: contract-testing.md
[Starlette documentation]: https://www.starlette.io/testclient/#asynchronous-tests
[HTTPie]: https://httpie.io/
[`curl`]: https://curl.se/
[override the dependency]: https://fastapi.tiangolo.com/advanced/testing-dependencies/
