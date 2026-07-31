import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from a2wsgi import ASGIMiddleware
from src.api.server import app as _app

_wsgi = ASGIMiddleware(_app)


def app(environ, start_response):
    path = environ.get("PATH_INFO", "")
    if path.startswith("/api/api"):
        environ["PATH_INFO"] = path[4:]
    elif path.startswith("/api") and len(path) <= 4:
        environ["PATH_INFO"] = "/"
    elif path.startswith("/api"):
        environ["PATH_INFO"] = path[4:] or "/"
    return _wsgi(environ, start_response)
