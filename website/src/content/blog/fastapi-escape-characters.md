---
title: "FastAPI Escape Character"
date: 2022-09-20
categories: ["FastAPI"]
---

Today, we'll talk about a small feature of **FastAPI** that might be useful for you: the escape character. 🤓

## What is the escape character?

The escape character `\f` is a character that can be used to tell to FastAPI to truncate what should go to the endpoint description on
the OpenAPI.

Let's see it in practice. Consider we have the following endpoint:

**Code**


`main.py`

```py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    """This is home.
    \f
    This is not on the OpenAPI.
    """
```

**Run**


Install the dependencies:

```bash
python -m pip install uvicorn fastapi
```

Then run `uvicorn`:

```bash
uvicorn main:app
```

---

When we call the `/openapi.json` endpoint:

```bash
http GET :8000/openapi.json
```

1. The HTTP client used is called [HTTPie](https://httpie.io/), but you can use [`curl`](https://curl.se/),
    or just go to the browser, and access [`http://localhost:8000/openapi.json`](http://localhost:8000/openapi.json).

You'll see the following OpenAPI JSON on the response:

```json
,
    "openapi": "3.0.2",
    "paths": 
                            }
                        },
                        "description": "Successful Response"
                    }
                },
                "summary": "Home"
            }
        }
    }
}
```

Observe the "description" field does not contain the **"This is not on OpenAPI"** part of the docstring.
The reason is the escape character we used. Everything after the `\f` will not appear on that field.

This feature may be useful if you are using a docstring linter tool, like [darglint](https://github.com/terrencepreilly/darglint).

## What's new?

If you are a FastAPI veteran (😎), you are probably familiar with the above.
What you _probably_ don't know, is that now (since FastAPI [0.82.0](https://fastapi.tiangolo.com/release-notes/#0820))
it's possible to use it on the Pydantic models you use on your FastAPI application.

Let's see another example.

**Code**


As most of my examples, we'll use potatoes:

`main.py`

```py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PotatoOutput(BaseModel):
    """Super potato.
    \f
    This is not on the OpenAPI.
    """

@app.get("/", response_model=PotatoOutput)
def get_potato():
    ...
```

**Run**


Install the dependencies:

```bash
python -m pip install uvicorn fastapi
```

Then run `uvicorn`:

```bash
uvicorn main:app
```

When we call `/openapi.json`, as we did above, we'll get the following OpenAPI JSON as response:

```json
,
                "title": "PotatoOutput",
                "type": "object"
            }
        }
    },
    "info": ,
    "openapi": "3.0.2",
    "paths": 
                            }
                        },
                        "description": "Successful Response"
                    }
                },
                "summary": "Get Potato"
            }
        }
    }
}
```

:::tip
We can also use [`jq`](https://stedolan.github.io/jq/) to get the part of the JSON that we are interested.

**Call**


```bash
http GET :8000/openapi.json | jq .components.schemas
```

**Output**


```json
,
        "description": "Super potato.\n"
    }
}
```
:::

As we can see, the description of `PotatoOutput` doesn't contain the "This is not on the OpenAPI." part as well.

Yey! Now you can use those docstring linter tools as you want with FastAPI! 🙌

---

Thanks for reading this blog post! 🥳

If you have any suggestions on what I can write about, please feel free to suggest below. 🙏
