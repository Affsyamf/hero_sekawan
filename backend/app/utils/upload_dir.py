import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def get_upload_dir() -> Path:
    """Get or create the upload directory based on .env or default."""
    env_dir = os.getenv("UPLOAD_DIR")
    if env_dir:
        path = Path(env_dir).expanduser().resolve()
    else:
        # Default to ~/.inventory-boilerplate/uploads
        path = Path.home() / ".inventory-boilerplate" / "uploads"

    path.mkdir(parents=True, exist_ok=True)
    return path