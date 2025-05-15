import os

import uvicorn

from api import app

PORT = os.environ.get("PORT", "8000")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))
