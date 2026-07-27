import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
// 1. IMPORT YOUR AUTH ROUTE HANDLERS HERE
// import { handleLogin, handleSignup } from "./routes/auth"; 

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // 2. ADD THE MISSING ENDPOINTS EXPRESS NEEDS TO CAPTURE
  app.post("/api/login", (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log("Login request intercepted for:", email);

      // Place your verification/database query validation logic here
      // E.g., verifying bcrypt weights or looking up records
      
      // Temporary stub response to stop the HTML fallback crash:
      return res.json({ 
        success: true, 
        message: "Endpoint reached successfully",
        user: { email } 
      });

    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  return app;
}