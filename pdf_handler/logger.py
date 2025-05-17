import atexit
import logging.config
import logging.handlers
import logging
import queue
import os

from pythonjsonlogger import jsonlogger


def new_logger(log_level: str):
    root_logger = logging.getLogger("root")
    root_logger.setLevel(log_level)

    logger_type = os.environ.get("LOGGER_TYPE", "STDOUT").upper()
    logger_type_error = False

    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(filename)s %(pathname)s %(lineno)d %(message)s"
    )

    if logger_type == "FILE":
        handler = logging.handlers.RotatingFileHandler(
            filename="logs/pdf_handler.log",
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
    elif logger_type == "STDOUT":
        handler = logging.StreamHandler()
    else:
        logger_type_error = True
        handler = logging.StreamHandler()

    handler.setFormatter(formatter)

    log_queue = queue.Queue()
    queue_handler = logging.handlers.QueueHandler(log_queue)
    queue_handler.setFormatter(formatter)
    root_logger.addHandler(queue_handler)

    lister = logging.handlers.QueueListener(log_queue, handler)
    lister.start()
    atexit.register(lister.stop)

    if logger_type_error:
        root_logger.warning(f"LOGGER_TYPE '{logger_type}' is not valid, using STDOUT")

    return root_logger
