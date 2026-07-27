"use client";

import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { HardDrive, AlertTriangle, Cloud, Server, RefreshCw, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface StorageMetrics {
  total_space_gb: number;
  used_space_gb: number;
  available_space_gb: number;
}

interface NodeHealthData {
  node_name: string;
  status: "Operational" | "Degraded" | "Critical";
  uptime_percentage: number;
  latency_ms: number;
  storage: StorageMetrics;
}

export default function SystemHealth() {
  const [cloudData, setCloudData] = useState<NodeHealthData[]>([]);
  const [edgeData, setEdgeData] = useState<NodeHealthData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthMetrics = async () => {
    try {
      const [cloudRes, edgeRes] = await Promise.all([
        fetch("/api/cloud-health"),
        fetch("/api/edge-health"),
      ]);

      if (cloudRes.ok) setCloudData(await cloudRes.json());
      if (edgeRes.ok) setEdgeData(await edgeRes.json());
    } catch (error) {
      console.error("Error fetching infrastructure health telemetry logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 10000); // Poll metrics every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper calculation to analyze metrics inline
  const computeStoragePercentage = (used: number, total: number) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  // Render uniform data blocks for Cloud and Edge topologies
  const renderHealthSection = (title: string, icon: React.ReactNode, dataset: NodeHealthData[]) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 pb-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>

        {dataset.length === 0 ? (
          <div className="text-sm p-6 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
            No active nodes reported under this cluster deployment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataset.map((node, index) => {
              const usedPct = computeStoragePercentage(node.storage.used_space_gb, node.storage.total_space_gb);
              const isOverCapacity = usedPct >= 90;

              return (
                <Card key={node.node_name || index} className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    {/* <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{node.node_name}</h3>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">Latency: {node.latency_ms}ms • Uptime: {node.uptime_percentage}%</p>
                    </div> */}
                    
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      node.status === "Operational" 
                        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                        : node.status === "Degraded"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {node.status}
                    </span>
                  </div>

                  {/* STORAGE MONITOR BLOCK */}
                  <div className="space-y-2 bg-gray-50 dark:bg-zinc-900/50 p-3.5 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <HardDrive size={13} /> Storage Space
                      </span>
                      <span className="font-mono text-gray-900 dark:text-gray-200">{usedPct}% Used</span>
                    </div>

                    <div className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isOverCapacity ? "bg-red-500 dark:bg-red-600 animate-pulse" : "bg-blue-500 dark:bg-blue-600"}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-[11px]">
                      <div>
                        <div className="text-gray-400 dark:text-gray-300 text-[10px] uppercase font-sans tracking-tight">Total</div>
                        <div className="font-bold text-gray-700 dark:text-gray-300">{node.storage.total_space_gb} GB</div>
                      </div>
                      <div>
                        <div className="text-gray-400 dark:text-gray-300 text-[10px] uppercase font-sans tracking-tight">Used</div>
                        <div className={`font-bold ${isOverCapacity ? "text-red-600 dark:text-red-400 font-extrabold" : "text-gray-700 dark:text-gray-300"}`}>{node.storage.used_space_gb} GB</div>
                      </div>
                      <div>
                        <div className="text-gray-400 dark:text-gray-300 text-[10px] uppercase font-sans tracking-tight">Available</div>
                        <div className="font-bold text-gray-700 dark:text-gray-300">{node.storage.available_space_gb} GB</div>
                      </div>
                    </div>
                  </div>

                  {/* CRITICAL OVER-ALLOCATION EXCEL ALERT */}
                  {isOverCapacity && (
                    <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-400 font-medium animate-fadeIn">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                      <div>
                        <strong className="block font-bold">Storage Alert Exception Raised</strong>
                        Disk consumption capacity has exceeded the safe limit. Immediate purge cycle required.
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Health Dashboard</h1>
            <p className="text-sm font-medium text-muted-foreground">Network Operations Center infrastructure telemetry feeds</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-900/50">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Synchronizing Storage Parameters..." : "Live System Sync Active"}</span>
          </div>
        </div>

        {loading && cloudData.length === 0 && edgeData.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400 dark:text-gray-500">
            Mapping server nodes storage arrays...
          </div>
        ) : (
          <div className="space-y-8">
            {/* CLOUD DEVICE INFRASTRUCTURE HEALTH SECTION */}
            {renderHealthSection(
              "Infrastructure Health",
              <Cloud className="text-blue-500" size={22} />,
              cloudData
            )}

            {/* EDGE DEVICE NETWORKS HEALTH SECTION */}
            {renderHealthSection(
              "GPU Device Health",
              <Server className="text-emerald-500" size={22} />,
              edgeData
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}