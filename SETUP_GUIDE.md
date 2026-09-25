# DRISHYAM Surveillance Command Center - Local Setup Guide

This guide explains how to run the DRISHYAM application locally on your machine.

## Prerequisites

You'll need the following installed on your system:

1. **Node.js & pnpm** (for building the React frontend)
   - [Install Node.js](https://nodejs.org/) - v16 or higher
   - Install pnpm: `npm install -g pnpm`

2. **Python 3** (for running the backend server)
   - [Install Python](https://www.python.org/downloads/) - v3.7 or higher

## Quick Start (Option 1: Python Server)

This is the recommended approach - builds and serves everything with a single command.

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Run the Application

```bash
python3 app.py
```

The server will:
1. ✓ Check if the React app is built
2. ✓ Build it if needed (using `pnpm build`)
3. ✓ Start a Flask server on `http://localhost:5000`

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:5000
```

## Development Setup (Option 2: Full Dev Experience)

If you want hot-reload and development features:

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Start Development Server

```bash
pnpm dev
```

This starts Vite dev server with React hot-reload on `http://localhost:5000`

### Step 3: Build for Production

```bash
pnpm build
```

## Project Structure

```
.
├── app.py                      # Python Flask server
├── requirements.txt            # Python dependencies
├── package.json                # Node/pnpm dependencies
├── client/                     # React frontend
│   ├── pages/                 # Route pages
│   │   ├── Login.tsx          # Login page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── CameraManagement.tsx
│   │   ├── NVRRecordings.tsx
│   │   ├── SystemHealth.tsx
│   │   ├── SiteMonitoring.tsx
│   │   └── Settings.tsx
│   ├── components/            # React components
│   │   ├── Layout.tsx         # Main layout with sidebar
│   │   └── ui/                # UI components
│   ├── App.tsx                # Main app file
│   └── global.css             # Global styles
├── server/                     # Express backend (if needed)
├── dist/                       # Built app (created after build)
└── tailwind.config.ts          # Tailwind CSS config
```

## Available Commands

### Frontend Development
```bash
pnpm dev              # Start dev server (hot reload)
pnpm build            # Build for production
pnpm start            # Start production build
pnpm typecheck        # Run TypeScript checks
pnpm test             # Run tests
```

### Running the App Locally
```bash
python3 app.py        # Run production server on port 5000
```
### For running in docker 
docker compose up -d --build


## Features

The DRISHYAM application includes:

- **Dashboard** - Real-time camera and alert overview
- **Camera Management** - Manage all surveillance cameras
- **NVR & Recordings** - Video playback and recording management
- **System Health** - Monitor system status and performance
- **Site Monitoring** - Site-level surveillance overview
- **Settings** - System configuration

## API Endpoints

The Flask server exposes the following API endpoints:

```
GET /api/health      - Health check endpoint
GET /api/config      - App configuration
```

## Troubleshooting

### Issue: "pnpm not found"
**Solution:** Install pnpm globally
```bash
npm install -g pnpm
```

### Issue: "ModuleNotFoundError: No module named 'flask'"
**Solution:** Install Python dependencies
```bash
pip install -r requirements.txt
```

### Issue: "Build folder not found"
**Solution:** Make sure you're in the project root directory and run:
```bash
pnpm build
```

## Environment Variables

Currently, no environment variables are required. The app runs with sensible defaults.

To add custom configuration later, modify `app.py` or add a `.env` file.

## Browser Support

The application works on:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the AGENTS.md file for technical architecture
3. Ensure all dependencies are installed correctly


---

**Enjoy using DRISHYAM! 🎥**
