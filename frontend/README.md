# 🎨 Skill to Income Engine (SIE) — Frontend Application

This directory connects the SIE React 19 + Vite + Tailwind CSS frontend application.

## Quick Start

To launch the local development server:

```powershell
cd frontend
pnpm install
pnpm dev
```

The frontend will start at `http://localhost:5173` and automatically proxy API requests to the FastAPI backend at `http://localhost:8000`.

## Architecture
- **Framework**: React 19 + Vite + Tailwind CSS
- **State & Query**: TanStack React Query v5
- **Icons**: Lucide React
- **API Client**: Auto-authenticated fetch wrapper with Bearer token & session cookie support
