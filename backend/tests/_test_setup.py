import sys
import types
from pathlib import Path


def setup_test_imports():
    backend_dir = Path(__file__).resolve().parents[1]
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    if "app" not in sys.modules:
        app_pkg = types.ModuleType("app")
        app_pkg.__path__ = [str(backend_dir / "app")]
        sys.modules["app"] = app_pkg
