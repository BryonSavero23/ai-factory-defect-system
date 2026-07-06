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