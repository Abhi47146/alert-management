// Dynamically checks if you are running Vite development mode or fallback to production
const API_BASE = import.meta.env.DEV 
  ? "" 
  : "http://127.0.0.1:8000"; // Your actual PostgreSQL Flask API port

// Now all your fetches look clean and adapt automatically:
const response = await fetch(`${API_BASE}/api/users`);