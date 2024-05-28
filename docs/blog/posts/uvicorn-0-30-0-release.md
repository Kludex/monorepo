---
date: 2024-05-28
categories:
- Uvicorn
links:
  - Uvicorn Release: https://www.uvicorn.org/release-notes/#0300-2024-05-28
readtime: 5
---

# Uvicorn 0.30.0 Release

Today, we are releasing Uvicorn 0.30.0! :tada:

There were several changes here, including:

1. Deprecate the `uvicorn.workers` module [#2302]
2. Add a new multiprocess manager [#2183]
3. Allow `ConfigParser` or a `io.IO[Any]` on `log_config` [#1976]

## Deprecate the `uvicorn.workers`

The `uvicorn.workers` module is used to provide two classes: `UvicornWorker` and `UvicornH11Worker`.

These classes are used to run Uvicorn with Gunicorn e.g. `gunicorn -k uvicorn.workers.UvicornWorker -w 4 main:app`.

Gunicorn is a popular WSGI server that can run multiple worker processes to handle incoming requests. When used with
Uvicorn, Gunicorn would act as a process manager and Uvicorn would act as the server handling the requests.

However, this approach is not recommended anymore. In this release, we also introduced a new multiprocess manager on Uvicorn's side,
that is meant to replace Gunicorn entirely.

For backward compatibility, you can install the [Uvicorn Worker](https://github.com/Kludex/uvicorn-worker) package:

```bash
pip install uvicorn-worker
```

## Add a new multiprocess manager

A new multiprocess manager was added to Uvicorn. The main goal is to be able to have a proper process manager that can handle
multiple workers and restart them when needed.

This was a long-awaited feature, and it's finally here! :tada:

Nothing needs to be done from the users side, the changes are already in place when using the `--workers` parameter.

You can see more details on the the pull request [#2183].

## Allow `ConfigParser` or a `io.IO[Any]` on `log_config`

With this change, you can now pass a `ConfigParser` programmatically to the `log_config` parameter on the `Uvicorn` class.

```py
import configparser
from uvicorn import Config, Server

config = Config(app=..., log_config=configparser.ConfigParser())
server = Server(config)
```

[#2302]: https://github.com/encode/uvicorn/pull/2302
[#1976]: https://github.com/encode/uvicorn/pull/1976
[#2183]: https://github.com/encode/uvicorn/pull/2183
