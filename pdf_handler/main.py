import os

import uvicorn

from api import app
from logger import logger

PORT = os.environ.get("PH_PORT", "8000")

if __name__ == "__main__":
    logger.info("Application started!!")
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))
