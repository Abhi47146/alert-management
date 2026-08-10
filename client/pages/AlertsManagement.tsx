"use client";

import Layout from "@/components/Layout";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Image as ImageIcon, ChevronLeft, ChevronRight, RefreshCw, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Alert {
  id: string;
  camera_scn: string;
  camera_name: string;
  site_name: string;
  alert_type_name: string;
  timestamp: string;
  image_url: string;
}

export default function AlertsManagement() {
  const [date, setDate] = useState<Date | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [alertTypes, setAlertTypes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tracking view states
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [selectedAlertType, setSelectedAlertType] = useState("All Alert Types");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal view configuration properties
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchAlerts = async (showLoadingBar = false) => {
    try {
      if (showLoadingBar) setLoading(true);
      const response = await fetch("/api/alerts");
      if (!response.ok) throw new Error("Failed to pull active incident logs");
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error logging database metrics fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites");
      const data = await response.json();
      setSites(data);
    } catch (e) { console.error(e); }
  };

  const fetchAlertTypes = async () => {
    try {
      const response = await fetch("/api/alert-types");
      const data = await response.json();
      setAlertTypes(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAlerts(true);
    fetchSites();
    fetchAlertTypes();

    const trackingInterval = setInterval(() => {
      fetchAlerts(false);
    }, 5000);

    return () => clearInterval(trackingInterval);
  }, []);

  // Reset pagination index if data matrix filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSite, selectedAlertType, date, pageSize]);

  const handleOpenPreview = (imageUrl: string) => {
    // --- UPDATED: Standardizes paths starting with /upload ---
    const fullImageUrl = imageUrl.startsWith("/upload")
      ? `${window.location.origin}${imageUrl}`
      : imageUrl;

    setPreviewImage(fullImageUrl);
    setPreviewOpen(true);
  };

  // MULTI-CONDITIONAL FILTERING ENGINE
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSite = selectedSite === "All Sites" || alert.site_name === selectedSite;
    const matchesType = selectedAlertType === "All Alert Types" || alert.alert_type_name === selectedAlertType;

    let matchesDate = true;
    if (date && alert.timestamp) {
      const alertDateStr = alert.timestamp.split(" ")[0];
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const selectedDateStr = `${year}-${month}-${day}`;
      matchesDate = alertDateStr === selectedDateStr;
    }
    return matchesSite && matchesType && matchesDate;
  });

  // Helper helper function to convert string timestamp formats cleanly for CSV output rows
  const formatTimestamp = (timestampString: string) => {
    if (!timestampString) return "N/A";
    const [datePart, timePart] = timestampString.split(" ");
    if (!datePart) return timestampString;
    const [year, month, day] = datePart.split("-");
    return `${day}-${month}-${year} ${timePart || ""}`.trim();
  };

  // CSV GENERATION AND DOWNLOAD CORE FUNCTION
  const exportToCSV = () => {
    if (filteredAlerts.length === 0) {
      alert("No matching records found to export.");
      return;
    }

    const headers = ["Alert ID", "Camera SCN", "Camera Name", "Site Name", "Alert Type", "Timestamp"];

    const csvRows = [
      headers.join(","),
      ...filteredAlerts.map((alert) => {
        return [
          `"${alert.id.replace(/"/g, '""')}"`,
          `"${alert.camera_scn.replace(/"/g, '""')}"`,
          `"${alert.camera_name.replace(/"/g, '""')}"`,
          `"${alert.site_name.replace(/"/g, '""')}"`,
          `"${alert.alert_type_name.replace(/"/g, '""')}"`,
          `"${formatTimestamp(alert.timestamp).replace(/"/g, '""')}"`
        ].join(",");
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");

    const dateString = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_alerts_export_${dateString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alerts Management</h1>
            <p className="text-sm font-medium text-muted-foreground">Monitor live network surveillance breach telemetry logs (Auto-refreshing)</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900/50">
            <RefreshCw size={12} className="animate-spin" />
            <span>Live Sync Engine Active</span>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex gap-4 flex-wrap items-center justify-between bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="w-48 relative">
              <DatePicker
                className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 w-full text-sm h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                selected={date}
                onChange={(d) => setDate(d)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Filter by Date"
                customInput={<Input placeholder="Filter by Date" />}
                isClearable
              />
            </div>

            <select
              className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:outline-none text-gray-900 dark:text-gray-100 h-10 focus:ring-2 focus:ring-blue-500"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="All Sites" className="bg-white dark:bg-zinc-900">All Sites</option>
              {sites.map((site: any) => (
                <option key={site.id} value={site.name} className="bg-white dark:bg-zinc-900">{site.name}</option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:outline-none text-gray-900 dark:text-gray-100 h-10 focus:ring-2 focus:ring-blue-500"
              value={selectedAlertType}
              onChange={(e) => setSelectedAlertType(e.target.value)}
            >
              <option value="All Alert Types" className="bg-white dark:bg-zinc-900">All Alert Types</option>
              {alertTypes.map((type: any) => (
                <option key={type.id} value={type.name} className="bg-white dark:bg-zinc-900">{type.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="h-10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-sm font-medium px-4"
            >
              <Download size={15} className="mr-2" />
              Export CSV Data
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Show rows:</span>
              <select
                className="px-2 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:outline-none text-gray-900 dark:text-gray-100 h-10 focus:ring-2 focus:ring-blue-500"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10} className="bg-white dark:bg-zinc-900">10 Rows</option>
                <option value={20} className="bg-white dark:bg-zinc-900">20 Rows</option>
                <option value={50} className="bg-white dark:bg-zinc-900">50 Rows</option>
                <option value={100} className="bg-white dark:bg-zinc-900">100 Rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* ALERTS SYSTEM LOG GRID */}
        <Card className="rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Camera SCN</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Camera Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Alert Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      Querying active log frames from database...
                    </td>
                  </tr>
                ) : paginatedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No active log entities match your system filter parameters.
                    </td>
                  </tr>
                ) : (
                  paginatedAlerts.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">{row.camera_scn}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{row.camera_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.site_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
                          {row.alert_type_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {formatTimestamp(row.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        {row.image_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            onClick={() => handleOpenPreview(row.image_url)}
                          >
                            <Eye size={14} className="mr-1.5" />
                            View Image
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic inline-flex items-center gap-1">
                            <ImageIcon size={12} /> No Media
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DYNAMIC PAGINATION CONTROLLER FRAME PANEL */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 flex-wrap gap-4">
            <div>
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems === 0 ? 0 : startIndex + 1}</span> to{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(endIndex, totalItems)}</span> of{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span> entries
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                <span className="ml-1 hidden sm:inline">Previous</span>
              </Button>

              <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md font-medium text-gray-900 dark:text-gray-100">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* SNAPSHOT IMAGE MODAL VIEW BOX CONTAINER */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Incident Snapshot Capture</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex justify-center bg-gray-950 rounded-lg overflow-hidden border border-gray-800 dark:border-zinc-800 p-1">
            {previewImage && (
              <img
                src={previewImage}
                alt="Alert snapshot capture"
                className="max-w-full max-h-[70vh] object-contain rounded"
                onError={(e) => {
                  // --- UPDATED: Graceful recovery if local image lookup breaks ---
                  (e.target as HTMLImageElement).src = "/upload/static/not_found.png";
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}