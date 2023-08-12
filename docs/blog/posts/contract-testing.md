---
date: 2022-11-03
categories:
- Testing
readtime: 5
---

# Contract Testing with HTTPX

Today, we are going to talk about how to achieve contract testing with **HTTPX**. :nerd:

## What is contract testing?

_**Contract testing** is a methodology for ensuring that two separate systems (such as two microservices) are compatible and are able to communicate with one other. It captures the interactions that are exchanged between each service, storing them in a contract, which can then be used to verify that both parties adhere to it._ - [Matt Fellows](https://pactflow.io/blog/what-is-contract-testing/)

## What is HTTPX?

_**[HTTPX](https://www.python-httpx.org/)** is a fully featured HTTP client for Python 3, which provides sync and async APIs, and support for both HTTP/1.1 and HTTP/2._

## How to do contract testing with HTTPX?

Well, to be completely transparent, I'm not sure if what you are about to read classifies as **contract testing**. :sweat_smile:

The problem we'll be trying to solve is the following:

> Consider we have **multiples services** running, and they **depend on each other**.
> We want to make sure that a **service** is not able able to **break another one**.

To achieve this your first thought would be "let's write end to end tests", but that will slow things down,
as each service needs to be up to run the tests, and given that, the setup needed is a bit more complex.

Check [this blog post](https://pactflow.io/blog/what-is-contract-testing/) (which I didn't read, but looks good) for more information about _**E2E testing vs Contract Testing**_.

## The solution

Let's assume we have two services. For [obvious reasons](https://github.com/Kludex), those services are FastAPI based. :eyes:

!!! note
    This can be achieved with any **web framework**. What matters here is that you should be using [**`httpx`**](https://www.python-httpx.org/).

=== "Service A"

    ```py linenums="1" title="service_a.py"
    import httpx
    from fastapi import APIRouter, FastAPI

    router = APIRouter(prefix="/a")


    @router.get("/")
    def get_a():
        return {"a": "a"}


    @router.get("/call_b")
    async def call_b():
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/b/")
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

Cool. Now, let's call the `/a/call_b` endpoint:

```bash
http :8001/a/call_b # (1)!
```

1. The HTTP client used is called [HTTPie](https://httpie.io/), but you can use [`curl`](https://curl.se/),
    or just go to the browser, and access [`http://localhost:8001/a/call_b`](http://localhost:8001/a/call_b).

As we see, the response is:

```json
{
    "b": "b"
}
```

---

Now, if we want to create a test, we can do something like:

=== "TestClient"

    ```py linenums="1" title="test_service_a.py"
    import pytest
    from fastapi.testclient import TestClient

    from service_a import app


    @pytest.fixture()
    def client():
        return TestClient(app)


    def test_call_b(client: TestClient) -> None:
        response = client.get("/a/call_b")
        assert response.status_code == 200
        assert response.json() == {"b": "b"}
    ```

    See more on the [Starlette documentation](https://www.starlette.io/testclient/).

=== "AsyncClient"

    ```py linenums="1" title="test_service_a.py"
    import httpx
    import pytest
    import pytest_asyncio

    from service_a import app


    @pytest_asyncio.fixture(name="client")
    async def testclient():
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            yield client


    @pytest.mark.asyncio
    async def test_call_b(client: httpx.AsyncClient) -> None:
        response = await client.get("/a/call_b")
        assert response.status_code == 200
        assert response.json() == {"b": "b"}
    ```

    See more on the [Starlette documentation](https://www.starlette.io/testclient/#asynchronous-tests).

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install pytest pytest-asyncio httpx requests
    ```

    Then open the terminal and run:

    ```bash
    python -m pytest test_service_a.py
    ```

---

That works perfectly, right? :thinking:

Well, yes. But remember what I said in the beginning? :sweat_smile:

> To achieve this your first thought would be "let's write end to end tests", but that will slow things down,
> as each service needs to be up to run the tests, and given that, the setup needed is a bit more complex.

So, what if we want to run the tests without having to run the services? :thinking:

## Patch the HTTP client

We can patch the HTTPX client to make it call the service B, without actually running the service B. :sparkles:

To achieve that, we'll be using [RESPX](https://lundberg.github.io/respx/): a simple library,
yet powerful, for mocking out the [`HTTPX`](https://www.python-httpx.org/) and [`HTTPCore`](https://www.encode.io/httpcore/)
libraries. :sparkles:

It's easy, let me show you! We just need to add a single fixture on the `test_service_a.py` file:

=== "TestClient"

    ```py linenums="1" title="test_service_a.py" hl_lines="15-21"
    import pytest
    import pytest_asyncio
    import respx
    from fastapi.testclient import TestClient

    from service_a import app
    from service_b import app as app_b


    @pytest.fixture()
    def client():
        return TestClient(app)


    @pytest_asyncio.fixture()
    async def create_contracts():
        async with respx.mock:  # (1)!
            respx.route(host="localhost", port=8000).mock(
                side_effect=respx.ASGIHandler(app_b)
            )
            yield


    def test_call_b(client: TestClient) -> None:
        response = client.get("/a/call_b")
        assert response.status_code == 200
        assert response.json() == {"b": "b"}
    ```

    1. The `respx.mock` context manager is used to mock the HTTPX client. :sparkles:

        Read more about it on the [RESPX documentation](https://lundberg.github.io/respx/guide/#route-with-an-app).

=== "AsyncClient"

    ```py linenums="1" title="test_service_a.py" hl_lines="16-22"
    import httpx
    import pytest
    import pytest_asyncio
    import respx

    from service_a import app
    from service_b import app as app_b


    @pytest_asyncio.fixture(name="client")
    async def testclient():
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            yield client


    @pytest_asyncio.fixture()
    async def create_contracts():
        async with respx.mock:  # (1)!
            respx.route(host="localhost", port=8000).mock(
                side_effect=respx.ASGIHandler(app_b)
            )
            yield


    @pytest.mark.asyncio
    async def test_call_b(client: httpx.AsyncClient) -> None:
        response = await client.get("/a/call_b")
        assert response.status_code == 200
        assert response.json() == {"b": "b"}
    ```

    1. The `respx.mock` context manager is used to mock the HTTPX client. :sparkles:

        Read more about it on the [RESPX documentation](https://lundberg.github.io/respx/guide/#route-with-an-app).

=== "Run"

    Install the dependencies:

    ```bash
    python -m pip install pytest pytest-asyncio httpx respx requests
    ```

    Then open the terminal and run:

    ```bash
    python -m pytest test_service_a.py
    ```

---

Nice! We did it! :tada:

Now, we can run the tests without having to run the services. :rocket:

If you are a curious person, feel free to compare the tests with the `time` command:

```bash
time python -m pytest test_service_a.py
```

Be surprised. :wink:

!!! info
    You can also read the continuation of this article [here](contract-testing2.md).
