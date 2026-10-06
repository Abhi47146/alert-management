"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Camera {
  id: string;
  name: string;
  site_id?: string;
  siteId?: string;
  site_name?: string;
  siteName?: string;
  stream_url?: string;
  streamUrl?: string;
  rtspUrl?: string;
  status: string;
  created_at?: string;
}

export default function CameraManagement() {
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);

  // Form input states
  const [cameraName, setCameraName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(false);

  // Data Matrices from backend APIs
  const [sites, setSites] = useState<any[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);

  // Table Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSite, setFilterSite] = useState("All Sites");
  const [filterStatus, setFilterStatus] = useState("All Status");

  const fetchCameras = async () => {
    try {
      const response = await fetch("/api/kerberos-cameras");
      if (!response.ok) throw new Error("Failed to fetch cameras");
      const data = await response.json();
      setCameras(data);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites");
      if (!response.ok) throw new Error("Failed to fetch sites");
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return "N/A";
    const foundSite = sites.find((s) => String(s.id) === String(siteId));
    return foundSite ? foundSite.name : "N/A";
  };

  const openEditModal = (camera: Camera) => {
    setIsEdit(true);
    setEditingCameraId(camera.id);
    // Preserves original casing when loading for edit
    setCameraName(camera.name || "");
    setSelectedSiteId(camera.site_id || camera.siteId || "");
    setStreamUrl(camera.stream_url || camera.streamUrl || camera.rtspUrl || "");
    setOpen(true);
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm("Are you sure you want to delete this camera stream?")) return;

    try {
      const response = await fetch(`/api/kerberos-cameras/${cameraId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCameras((prev) => prev.filter((cam) => cam.id !== cameraId));
        alert("Camera stream deleted successfully.");
      } else {
        const resData = await response.json().catch(() => ({}));
        alert(`Failed to delete camera: ${resData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting camera stream:", error);
      alert("Operational failure while trying to delete camera.");
    }
  };

  const resetForm = () => {
    setIsEdit(false);
    setEditingCameraId(null);
    setCameraName("");
    setSelectedSiteId("");
    setStreamUrl("");
  };

  useEffect(() => {
    fetchCameras();
    fetchSites();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedSiteObj = sites.find((s) => String(s.id) === String(selectedSiteId));

    const cameraPayload = {
      camera_name: cameraName.trim(),
      rtsp_url: streamUrl.trim(),
      site_id: selectedSiteId,
      site_name: selectedSiteObj ? selectedSiteObj.name : "Primary Site",
    };

    try {
      const url = isEdit ? `/api/kerberos-cameras/${editingCameraId}` : "/api/kerberos-cameras";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cameraPayload),
      });

      const resData = await response.json();

      if (response.ok) {
        alert(isEdit ? "Camera updated successfully!" : "MediaMTX stream configured successfully!");
        await fetchCameras();
        setOpen(false);
        resetForm();
      } else {
        alert(`Failed: ${resData.error || "Unknown server error"}`);
      }
    } catch (error) {
      console.error("Submission operational failure:", error);
      alert("Operational failure while connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // ROBUST FILTER LOGIC (Supports camelCase & snake_case)
  const filteredCameras = cameras.filter((camera) => {
    // 1. Search Query Filter
    const matchesSearch =
      searchQuery.trim() === "" ||
      camera.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

    // 2. Resolve Site Identification
    const camSiteId = String(camera.site_id || camera.siteId || "");
    const camSiteName = (camera.site_name || camera.siteName || getSiteName(camSiteId)).toLowerCase();

    const selectedSiteObj = sites.find((s) => String(s.id) === String(filterSite));
    const selectedSiteName = selectedSiteObj ? selectedSiteObj.name.toLowerCase() : "";

    const matchesSite =
      filterSite === "All Sites" ||
      camSiteId === String(filterSite) ||
      (selectedSiteName !== "" && camSiteName.includes(selectedSiteName));

    // 3. Status Filter
    const mappedStatus = camera.status === "active" ? "Online" : "Offline";
    const matchesStatus =
      filterStatus === "All Status" ||
      mappedStatus === filterStatus;

    return matchesSearch && matchesSite && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Camera Stream & Recording Management
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Configure RTSP sources for live streaming and automatic MP4 file recordings
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsEdit(false)}
            >
              <Plus size={18} className="mr-2" />
              Add Camera Stream
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isEdit ? "Update Camera Stream" : "Add New Camera Stream"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                Enter the camera credentials and source URL.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Camera Name (Unique Identifier)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Camera21"
                  value={cameraName}
                  onChange={(e) => setCameraName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site Name
                </label>
                <select
                  className="w-full h-10 border border-gray-200 dark:border-zinc-800 rounded-md px-3 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  required
                >
                  <option value="" className="bg-white dark:bg-zinc-900">
                    Select Site
                  </option>
                  {sites.map((site: any) => (
                    <option key={site.id} value={site.id} className="bg-white dark:bg-zinc-900">
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source RTSP Stream URL
                </label>
                <Input
                  type="text"
                  placeholder="rtsp://admin:pass@192.168.1.50:554/stream1"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Processing..." : isEdit ? "Update Camera" : "Save & Start Stream"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search by Camera Name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none h-10"
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
        >
          <option value="All Sites" className="bg-white dark:bg-zinc-900">
            All Sites
          </option>
          {sites.map((site: any) => (
            <option key={site.id} value={site.id} className="bg-white dark:bg-zinc-900">
              {site.name}
            </option>
          ))}
        </select>

        <select
          className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none h-10"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All Status" className="bg-white dark:bg-zinc-900">
            All Status
          </option>
          <option value="Online" className="bg-white dark:bg-zinc-900">
            Online
          </option>
          <option value="Offline" className="bg-white dark:bg-zinc-900">
            Offline
          </option>
        </select>
      </div>

      {/* TABLE */}
      <Card className="rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Camera Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Site Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Source RTSP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredCameras.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No active camera streams found.
                  </td>
                </tr>
              ) : (
                filteredCameras.map((camera) => {
                  const resolvedSiteName = camera.site_name || camera.siteName || getSiteName(camera.site_id || camera.siteId);
                  const resolvedRtsp = camera.rtspUrl || camera.stream_url || camera.streamUrl || "N/A";

                  return (
                    <tr key={camera.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {camera.name}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {resolvedSiteName}
                      </td>

                      <td
                        className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate font-mono"
                        title={resolvedRtsp}
                      >
                        {resolvedRtsp}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            camera.status === "active"
                              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
                              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              camera.status === "active" ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          {camera.status === "active" ? "Online" : "Offline"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-right space-x-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          onClick={() => openEditModal(camera)}
                        >
                          <Edit2 size={15} />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => handleDeleteCamera(camera.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}