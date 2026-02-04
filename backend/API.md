# Backend API Documentation (HTML → PDF Converter)

This document describes all backend endpoints for the FastAPI service that converts HTML files to PDF.

## Base URL

- Local development: `http://localhost:8000`

## Overview

The backend provides:
- A health check endpoint.
- A conversion endpoint that accepts a single HTML file and returns a PDF.

**Limits**
- Maximum file size: **200 MB**.
- Supported input types: `.html`, `.htm`.
- Public API (no authentication required).
- Files are stored on local disk temporarily and deleted about **2 minutes** after conversion.

---

## Endpoint: Health Check

**GET** `/health`

### Purpose
Simple readiness/liveness check.

### Request
- No parameters.

### Response
**200 OK**
```json
{
  "status": "ok"
}
```

---

## Endpoint: Convert HTML to PDF

**POST** `/convert`

### Purpose
Upload a single HTML file and receive the converted PDF.

### Request
**Content-Type:** `multipart/form-data`

Form fields:
- `file` (required): HTML file (`.html` or `.htm`), max **200 MB**.

Example (cURL):
```bash
curl -X POST "http://localhost:8000/convert" \
  -H "accept: application/pdf" \
  -F "file=@/path/to/file.html" \
  --output output.pdf
```

### Success Response
**200 OK**
- Content-Type: `application/pdf`
- Body: PDF binary
- Suggested filename: `output.pdf`

### Error Responses

**400 Bad Request**
- Missing file or invalid extension.
```json
{
  "detail": "Missing file"
}
```
```json
{
  "detail": "Only .html or .htm files are supported"
}
```

**413 Payload Too Large**
- File exceeds 200 MB.
```json
{
  "detail": "File too large (max 200MB)"
}
```

**500 Internal Server Error**
- Conversion failed (e.g., rendering errors, Playwright failure).
```json
{
  "detail": "Conversion failed: <reason>"
}
```

---

## Implementation Notes (for Frontend)

- The conversion response is a binary PDF. The frontend should handle it as a file download.
- Suggested flow: upload -> await response -> prompt download.
- Time to convert depends on file size and complexity.
- Files are automatically deleted server-side ~2 minutes after conversion.

---

## Changelog

- v0.1: Initial endpoints and documentation.
