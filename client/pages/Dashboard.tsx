import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Camera, AlertTriangle, Wifi, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface CameraItem {
  id: string;
  name: string;
  agent_port: number;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_cameras: 0,
    online_cameras: 0,
    offline_cameras: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch live camera list and calculate statistics dynamically
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/kerberos-cameras");
      if (!response.ok) throw new Error("Failed to fetch cameras");

      const cameras: CameraItem[] = await response.json();

      const total = cameras.length;
      const online = cameras.filter((cam) => cam.status === "active").length;
      const offline = total - online;

      setStats({
        total_cameras: total,
        online_cameras: online,
        offline_cameras: offline,
      });
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Optional: Auto-refresh stats every 10 seconds for real-time monitoring
    const interval = setInterval(fetchDashboardStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Title with Manual Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            System Overview
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Real-time operational status across all deployed camera agents
          </p>
        </div>


      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Total Cameras */}
        <Card className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Cameras
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? "--" : stats.total_cameras}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
              <Camera size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Online Cameras */}
        <Card className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Online Cameras
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {loading ? "--" : stats.online_cameras}
              </p>
            </div>

            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center">
              <Wifi size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        {/* Offline Cameras */}
        <Card className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Offline Cameras
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {loading ? "--" : stats.offline_cameras}
              </p>
            </div>

            <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}