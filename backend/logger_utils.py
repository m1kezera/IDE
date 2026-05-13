import asyncio
import json
import logging
from typing import List

LOG_SUBSCRIBERS: List[asyncio.Queue] = []

class SSELoggingHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            log_entry = json.dumps({
                "level": record.levelname,
                "message": msg,
                "source": record.name
            })
            for q in LOG_SUBSCRIBERS:
                try:
                    q.put_nowait(log_entry)
                except BaseException:
                    pass
        except Exception:
            self.handleError(record)

def setup_sse_logger():
    sse_handler = SSELoggingHandler()
    sse_handler.setFormatter(logging.Formatter("%(message)s"))
    # Hook into our main logger
    logging.getLogger("projecty").addHandler(sse_handler)
    # Could hook others like uvicorn as well if desired
    # logging.getLogger("uvicorn.error").addHandler(sse_handler)
