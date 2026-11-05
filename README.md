# AI Factory Defect Detection & QDN Automation System

An AI-powered manufacturing quality inspection system built to detect production defects, automate QDN lot containment, and provide real-time engineering visibility through dashboard APIs.

## Project Goal

This project simulates a smart manufacturing inspection workflow where product images are uploaded, analyzed by an AI defect detection service, stored in a database, and automatically evaluated for QDN containment action.

The system is designed around manufacturing use cases such as:

- Computer Vision defect inspection
- Lot-based quality tracking
- Automated QDN containment
- Defect trend monitoring
- Engineering dashboard reporting

## Tech Stack

### Backend
- Python
- FastAPI
- SQLModel
- SQLite currently, PostgreSQL planned
- OpenCV planned
- YOLO11 planned

### Frontend
- React
- TypeScript
- Vite
- Recharts planned

### DevOps
- Git
- GitHub
- Docker planned

## Vercel deployment

The Vercel configuration at the repository root builds the React/Vite app from
`frontend/`, publishes `frontend/dist`, and rewrites requests to the SPA entry
point. Import the repository into Vercel with the repository root as the project
root; the configured install and build commands handle the frontend subdirectory.

Add these frontend variables in **Vercel → Project → Settings → Environment
Variables** (then redeploy so Vite can include them in the build):

| Variable | Value | Purpose |
| --- | --- | --- |
| `VITE_DEMO_MODE` | `true` | Recommended for a standalone portfolio demo. Uses sample dashboard metrics and simulated defect/QDN inspection results without calling an API. |
| `VITE_API_URL` | Your hosted API origin, e.g. `https://api.example.com` | Optional when using demo mode; set this to connect a separately hosted FastAPI backend. |

`VITE_API_BASE_URL` remains supported as a compatibility alias. In local Vite
development the API defaults to `http://localhost:8000`; in production, an
unset API URL enables demo mode. If an explicitly configured API cannot be
reached, dashboard data and inspection submissions fall back to clearly marked
simulated results. No uploaded image is sent to or analyzed by the demo.

The FastAPI application is separate from the Vercel static frontend. Its
computer-vision dependencies, SQLite database, and local uploads are not
provided by this Vercel deployment. To connect a separately hosted API, set its
`FRONTEND_ORIGINS` environment variable to a comma-separated list containing
the deployed Vercel origin (and any local development origins that are needed),
for example `https://your-project.vercel.app,http://localhost:5173`.

## Current Features

- FastAPI backend setup
- Image upload endpoint
- Mock AI defect prediction
- QDN rule-based containment logic
- Inspection record persistence
- QDN record persistence
- Dashboard summary API
- Defect breakdown API
- Machine inspection breakdown API

## System Workflow

```text
Product Image Upload
        ↓
Computer Vision Prediction Service
        ↓
Defect Type + Confidence Score
        ↓
Inspection Record Saved
        ↓
QDN Rule Evaluation
        ↓
Automatic Lot Hold if Required
        ↓
Dashboard Metrics Updated