# DRISHYAM - Python Flask Server Setup

## What is this?

The `app.py` file is a Python Flask server that serves the complete DRISHYAM Surveillance Command Center application locally on your machine. It builds and serves the entire React frontend as static files.

## Quick Start - 3 Steps

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

Or if using pip3:
```bash
pip3 install -r requirements.txt
```

### Step 2: Run the Application

Choose one of these methods:

**Option A: Using Python directly**
```bash
python3 app.py
```

**Option B: Using the shell script (Mac/Linux)**
```bash
chmod +x run.sh
./run.sh
```

**Option C: Using the batch file (Windows)**
```bash
run.bat
```

### Step 3: Open in Browser

Once the server starts, open your browser and go to:
```
http://localhost:5000
```

The server will print the URL in the console.

## Default Login Credentials

| Field | Value |
|-------|-------|
| Email | admin@drishyam.com |
| Password | password |

## What Happens When You Run It?

1. ✓ Checks if the React app is already built (in `dist/spa/`)
2. ✓ If not built, it runs `pnpm build` automatically
3. ✓ Starts a Flask server on port 5000
4. ✓ Serves the entire application

## Available Routes

Once running, you can access:

| Route | Description |
|-------|-------------|
| http://localhost:5000/login | Login page |
| http://localhost:5000/dashboard | Main dashboard |
| http://localhost:5000/camera-management | Camera management |
| http://localhost:5000/nvr-recordings | NVR & recordings |
| http://localhost:5000/alerts | Alerts management |
| http://localhost:5000/system-health | System health |
| http://localhost:5000/site-monitoring | Site monitoring |
| http://localhost:5000/settings | Settings |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/health | GET | Check server health |
| /api/config | GET | Get app configuration |

## Project Structure

```
.
├── app.py                      ← Python Flask server (RUN THIS)
├── requirements.txt            ← Python dependencies
├── client/                      ← React source code
│   ├── pages/                  ← Page components
│   ├── components/             ← React components
│   ├── App.tsx                 ← Main app file
│   └── global.css              ← Global styles
├── dist/spa/                   ← Built app (created after build)
├── package.json                ← Node.js dependencies
└── tailwind.config.ts          ← Tailwind CSS config
```

## Requirements

- **Python 3.7+** - Download from https://www.python.org/downloads/
- **pnpm** (optional, for development)
  - Install with: `npm install -g pnpm`

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"

**Solution:** Install Python dependencies
```bash
pip install -r requirements.txt
```

### "pnpm not found" or "Build failed"

The app.py will try to build the React app automatically. If you have pnpm installed:
```bash
pnpm install
pnpm build
```

Then run the app again:
```bash
python3 app.py
```

### "Port 5000 already in use"

**Solution:** Kill the process using port 5000 or edit app.py to use a different port.

**On Mac/Linux:**
```bash
lsof -i :5000
kill -9 <PID>
```

**On Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Or edit app.py:**
Change `port=5000` to `port=5001` in the last line.

### "Cannot find dist/spa/"

The build folder should be created automatically. If it's missing:

1. Install pnpm: `npm install -g pnpm`
2. Install dependencies: `pnpm install`
3. Build the app: `pnpm build`
4. Run the server: `python3 app.py`

## Files in This Project

### Core Files
- **app.py** - Main Flask server (run this)
- **requirements.txt** - Python package dependencies

### Quick Start Scripts
- **run.sh** - Mac/Linux startup script
- **run.bat** - Windows startup script

### Documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **README_PYTHON.md** - This file

### Source Code
- **client/** - React frontend source
- **server/** - Express backend (optional)
- **package.json** - Node.js configuration
- **tailwind.config.ts** - Tailwind CSS configuration

## Development vs Production

### Production (What You're Running)
- Uses pre-built, optimized React bundle
- Flask serves static files
- Lightweight and fast
- No hot-reload

### Development (For Development)
```bash
pnpm dev
```
- Vite dev server with hot-reload
- Full debugging capabilities
- Slower initial load, instant updates

## How It Works

1. **Flask Server** reads files from `dist/spa/` (the built React app)
2. **For static files** (CSS, JS, images) - serves them directly
3. **For SPA routes** - serves `index.html`, React Router handles navigation
4. **API endpoints** - Flask provides `/api/health` and `/api/config`

## Advanced Usage

### Change Port
Edit `app.py`, find the last line:
```python
app.run(host="127.0.0.1", port=5000)
```
Change `5000` to your desired port.

### Enable Debug Mode
Edit `app.py`, change:
```python
debug=False
```
to:
```python
debug=True
```

### Access from Network
Edit `app.py`, change:
```python
host="127.0.0.1"
```
to:
```python
host="0.0.0.0"
```
Then access from other machines using your IP: `http://192.168.x.x:5000`

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | Server not running | Run `python3 app.py` |
| "404 Not Found" | Wrong route | Check URL, should start with `/` |
| "Module not found" | Missing deps | Run `pip install -r requirements.txt` |
| "Port in use" | Another app on 5000 | Change port in app.py or kill other process |

## Features Included

✓ Real-time dashboard
✓ Camera management
✓ Video playback
✓ Alert management
✓ System health monitoring
✓ Site monitoring
✓ Responsive design
✓ User authentication (mock)

## Browser Support

Works on:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Security Notes

⚠️ **Important for Development**
- Default credentials are for testing
- No real authentication is implemented
- Do not expose to the internet
- Use HTTPS in production

## Next Steps

1. **Run the app**: `python3 app.py`
2. **Open browser**: http://localhost:5000
3. **Login**: admin@drishyam.com / password
4. **Explore**: Navigate through all pages

## Questions or Issues?

1. Check SETUP_GUIDE.md for detailed instructions
2. Review troubleshooting section above
3. Verify Python and dependencies are installed
4. Check console output for error messages

## License

DRISHYAM Surveillance Command Center - All Rights Reserved

---

**Enjoy! 🎥**
