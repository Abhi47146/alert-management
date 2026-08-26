import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Camera, AlertTriangle, Wifi, Clock, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_cameras: 0,
    total_rtsp_cameras: 0,
    total_solar_cameras: 0,
    alerts_last_hour: 0,
    active_rtsp_cameras: 0,
    inactive_rtsp_cameras: 0,
    online_rtsp_cameras: 0,
    offline_rtsp_cameras: 0,
    active_solar_cameras: 0,
    inactive_solar_cameras: 0,
    online_solar_cameras: 0,
    offline_solar_cameras: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error("Dashboard stats error:", err);
      });
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* Core Overview Cards */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_cameras}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Camera size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Relay Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_rtsp_cameras}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Camera size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Solar Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_solar_cameras}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sun size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts (Last Hour)</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.alerts_last_hour}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          {/* RTSP Status Cards */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Relay Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.active_rtsp_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Relay Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.inactive_rtsp_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Relay Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.online_rtsp_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline Relay Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.offline_rtsp_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          {/* Solar Status Cards */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Solar Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.active_solar_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Solar Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.inactive_solar_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Solar Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.online_solar_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline Solar Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.offline_solar_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </Layout>
  );
}