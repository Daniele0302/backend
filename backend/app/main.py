import asyncio
import os
import shutil
import tempfile
import threading
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright

APP_NAME = "html-to-pdf"
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024
CLEANUP_DELAY_SECONDS = 120
TEMP_ROOT = Path(os.getenv("TEMP_ROOT", tempfile.gettempdir())) / APP_NAME

app = FastAPI(title="HTML to PDF Converter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def _ensure_temp_root() -> None:
    TEMP_ROOT.mkdir(parents=True, exist_ok=True)


def _schedule_delete(path: Path, delay_seconds: int = CLEANUP_DELAY_SECONDS) -> None:
    def _delete_later() -> None:
        try:
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            else:
                path.unlink(missing_ok=True)
        except Exception:
            pass

    timer = threading.Timer(delay_seconds, _delete_later)
    timer.daemon = True
    timer.start()


async def _save_upload(file: UploadFile, dest: Path) -> None:
    size = 0
    with dest.open("wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="File too large (max 200MB)")
            f.write(chunk)


@app.middleware("http")
async def limit_content_length(request: Request, call_next):
    content_length: Optional[str] = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_FILE_SIZE_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "File too large (max 200MB)"},
                )
        except ValueError:
            pass
    return await call_next(request)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")
    if not file.filename.lower().endswith((".html", ".htm")):
        raise HTTPException(status_code=400, detail="Only .html or .htm files are supported")

    _ensure_temp_root()
    workdir = Path(tempfile.mkdtemp(prefix="job-", dir=TEMP_ROOT))
    html_path = workdir / "input.html"
    pdf_path = workdir / "output.pdf"

    try:
        await _save_upload(file, html_path)
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    finally:
        await file.close()

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto(f"file://{html_path}")
            await page.pdf(path=str(pdf_path), print_background=True)
            await browser.close()
    except Exception as exc:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}")

    _schedule_delete(workdir)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="output.pdf",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
