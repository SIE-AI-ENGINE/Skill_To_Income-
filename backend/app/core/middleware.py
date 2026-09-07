from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger(__name__)

async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except IntegrityError as exc:
        logger.error(f"Integrity Error: {exc}")
        return JSONResponse(
            status_code=400,
            content={"detail": "Database Integrity Error (e.g. duplicate record)."},
        )
    except Exception as exc:
        logger.error(f"Unhandled Exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error."},
        )
