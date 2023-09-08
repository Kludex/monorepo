from apistar import App, Route


def welcome(name: str | None = None):
    if name is None:
        return {"message": "Welcome to API Star!"}
    return {"message": "Welcome to API Star, %s!" % name}


app = App(routes=[Route("/", method="GET", handler=welcome)])


if __name__ == "__main__":
    app.serve("127.0.0.1", 5000, debug=True)
