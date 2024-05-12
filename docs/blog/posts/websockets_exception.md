---
date: 2024-05-12
categories:
- WebSockets
readtime: 5
---

# Managing Exceptions in WebSockets with FastAPI

In this post, we delve into the management of exceptions in WebSockets, focusing on a potent but often
overlooked feature: the `WebSocketException` offered by [Starlette][starlette].

## Understanding `WebSocketException`

Conceptually, `WebSocketException` enables you to close a WebSocket connection with a specific code and reason
by raising this exception in your WebSocket route. Here's an illustrative example:

```python
from fastapi import FastAPI, WebSocket
from fastapi.exceptions import WebSocketException

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    raise WebSocketException(code=1008, reason="Closing the connection...")
```

In this instance, a `WebSocketException` is raised bearing the code `1008` and the explicit reason for closure: `"Closing the connection..."`.

To run this application, first install FastAPI, Uvicorn, and WebSockets:

```bash
pip install fastapi uvicorn websockets
```

Run the application using Uvicorn:

```
uvicorn main:app --reload
```

On opening a WebSocket connection to ws://localhost:8000/ws, you will find the connection being closed with focal code
1008 and the attributed reason.

I use wscat for testing WebSocket connections; you can install it with the following command:

```bash
npm install -g wscat
```

A connection is opened with:

```bash
wscat -c ws://127.0.0.1:8000/ws
```

## Handle custom exceptions

The `app.exception_handler` can be used to handle custom exceptions. Consider the following sample:

```python
from fastapi import FastAPI, WebSocket
from fastapi.exceptions import WebSocketException

app = FastAPI()

class CustomException(Exception): ...

@app.exception_handler(CustomException)
async def custom_exception_handler(websocket: WebSocket, exc: Exception):
    await websocket.close(code=1008, reason="Custom exception")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    raise CustomException()
```

In this example, the client receives a WebSocket closure with code 1008 and the reason "Custom exception"
when the `CustomException` is raised.

Feel free to connect with me on [LinkedIn][linkedin] for any questions or discussions on this topic.

Happy coding! 🚀

[starlette]: https://www.starlette.io/websockets/
[linkedin]: https://www.linkedin.com/in/marcelotryle/
