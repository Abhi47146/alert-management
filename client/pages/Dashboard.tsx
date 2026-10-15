import { Card } from "@/components/ui/card";
import { Camera, AlertTriangle, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import CameraMap from "@/components/CameraMap";

interface CameraItem {
  id: string;
  name: string;
  agent_port: number;
  status: string;
  latitude: number;
  longitude: number;
  siteName?: string;
  site_name?: string;
}

export default function Dashboard() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [stats, setStats] = useState({
    total_cameras: 0,
    online_cameras: 0,
    offline_cameras: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await fetch("/api/kerberos-cameras");
      if (!response.ok) throw new Error("Failed to fetch cameras");

      const data: CameraItem[] = await response.json();
      setCameras(data);

      const total = data.length;
      const online = data.filter((cam) => cam.status === "active").length;
      const offline = total - online;

      setStats({
        total_cameras: total,
        online_cameras: online,
        offline_cameras: offline,
      });
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(true);

    const interval = setInterval(() => fetchDashboardStats(false), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            System Overview
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Real-time operational status across all deployed cameras
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

      {/* Map Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Site Overview Map
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            Live positions of all deployed camera sites
          </p>
        </div>

        <CameraMap cameras={cameras} />
      </div>
    </div>
  );
}