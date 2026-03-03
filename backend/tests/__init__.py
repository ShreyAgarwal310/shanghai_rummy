import sys
import types
from pathlib import Path

if "app" not in sys.modules:
    app_pkg = types.ModuleType("app")
    app_pkg.__path__ = [str(Path(__file__).resolve().parents[1] / "app")]
    sys.modules["app"] = app_pkg
