import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Camera, AlertTriangle, Wifi, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_cameras: 0,
    active_cameras: 0,
    inactive_cameras: 0,
    online_cameras: 0,
    offline_cameras: 0,
    alerts_last_hour: 0,
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
        {/* Adjusted to grid-cols-6 for large screens so all 6 cards fit perfectly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-20">

          {/* Total Cameras */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground"> Total Cameras </p>
                <p className="mt-2 text-3xl font-bold text-foreground"> {stats.total_cameras} </p>
              </div>

              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Camera size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Active Cameras */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.active_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-green-600" />
              </div>
            </div>
          </Card>

          {/* Inactive Cameras */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.inactive_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-gray-600" />
              </div>
            </div>
          </Card>

          {/* Online Cameras */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.online_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wifi size={20} className="text-emerald-600" />
              </div>
            </div>
          </Card>

          {/* Offline Cameras */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline Cameras</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.offline_cameras}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
            </div>
          </Card>

          {/* Alerts (Last Hour) */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts (Last Hour)</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.alerts_last_hour}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}