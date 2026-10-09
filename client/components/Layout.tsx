"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Menu,
  BarChart3,
  Camera,
  MapPin,
  HardDrive,
  Heart,
  Settings,
  LogOut,
  Sun,
  Moon,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";

interface UserProfile {
  name: string;
  role_name: string;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setMounted(true);
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
      }
    }
  }, []);

  const navItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: MapPin, label: "Site Management", path: "/site-management" },
    { icon: Camera, label: "Camera Management", path: "/camera-management" },
    { icon: HardDrive, label: "NVR & Recordings", path: "/nvr-recordings" },
    { icon: VideoIcon, label: "Live Monitoring", path: "/live-view" },
    { icon: Heart, label: "System Health", path: "/system-health" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
    navigate("/login");
  };

  // Prevent Hydration mismatch flags from next-themes/localStorage mismatch
  if (!mounted) return null;

  // Safely extract names with defaults
  const userFirstLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : "A";
  const userFirstName = user?.name ? user.name.trim().split(/\s+/)[0] : "Admin";
  const userRole = user?.role_name || "User";

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors">
      
      {/* Sidebar - Stays consistently professional dark color but responsive to toggles inside */}
      <div
        className={`${
          sidebarOpen ? "w-56" : "w-20"
        } bg-[hsl(207,31%,23%)] text-white transition-all flex flex-col`}
      >
        
        <div className="p-4 border-t border-[hsl(207,31%,28%)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex justify-start px-3 text-gray-400 hover:text-white hover:bg-[hsl(207,31%,28%)] bg-transparent border-none"
        >
          <Menu size={18} />
        </Button>
      </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group ${
                  active
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-[hsl(207,31%,28%)]"
                }`}
                title={!sidebarOpen ? item.label : ""}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu / Logout */}
        <div className="p-4 border-t border-[hsl(207,31%,28%)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-950/20 transition-colors group"
            title="Logout"
          >
            <LogOut size={18} className="flex-shrink-0 text-gray-400 group-hover:text-red-400" />
            {sidebarOpen && <span className="text-sm truncate">Logout</span>}
          </button>
        </div>

      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                D
              </div>
              <div>
                <h1 className="font-bold text-md leading-none mb-1 text-gray-900 dark:text-gray-100">DRISHYAM</h1>
                <p className="text-[11px] font-medium text-muted-foreground">Surveillance Command Center</p>
              </div>
            </div>
          </div>

          {/* Right Action Elements: Logo / Theme Toggle / Profile */}
          <div className="flex items-center gap-4">
            
            {/* Logo Image */}
            <div className="flex items-center pr-2 border-r border-border">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="h-9 w-auto object-contain rounded-md"
              />
            </div>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </Button>

            {/* Profile Block */}
            <div className="flex items-center gap-3 pl-4 border-l border-border h-8">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {userFirstLetter}
              </div>

              <div className="text-left hidden sm:block">
                <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 leading-none mb-0.5">
                  {userFirstName}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium leading-none">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Page Inject Space */}
        <div className="flex-1 overflow-auto bg-muted/30 transition-colors">
          <div className="p-8"><Outlet /></div>
        </div>
      </div>
    </div>
  );
}

