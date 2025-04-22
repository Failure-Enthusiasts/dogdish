import atexit
import logging.config
import logging.handlers
import logging
import queue
import os

from pythonjsonlogger import jsonlogger


def setup_logging():
    root_logger = logging.getLogger("root")
    root_logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(filename)s %(pathname)s %(lineno)d %(message)s"
    )
    handler = logging.FileHandler(filename="logs/pdf_handler.log")

    log_queue = queue.Queue()
    queue_handler = logging.handlers.QueueHandler(log_queue)
    queue_handler.setFormatter(formatter)
    root_logger.addHandler(queue_handler)

    lister = logging.handlers.QueueListener(log_queue, handler)
    lister.start()
    atexit.register(lister.stop)

    return root_logger

logger = setup_logging()