import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Search, Play, Square } from "lucide-react";
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
  camera_scn: string;
  name: string;
  site_id: string;
  site_name: string;
  stream_url: string;
  ip_address: string;
  status: string;
  is_process: boolean;
  monitoring_start_time?: string;
  monitoring_end_time?: string;
}

export default function CameraManagement() {
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  
  // Form input states
  const [cameraScn, setCameraScn] = useState("");
  const [cameraName, setCameraName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [password, setPassword] = useState("");
  const [StartTime, setStartTime] = useState("");
  const [EndTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Data Matrices from backend APIs
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  
  // Table Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSite, setFilterSite] = useState("All Sites");
  const [filterStatus, setFilterStatus] = useState("All Status");

  const fetchCameras = async () => {
    try {
      const response = await fetch("/api/cameras");
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

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm("Are you sure you want to delete this camera node?")) return;

    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCameras((prev) => prev.filter((cam) => cam.id !== cameraId));
        alert("Camera node deactivated from database successfully.");
      } else {
        alert("Failed to delete camera from backend.");
      }
    } catch (error) {
      console.error("Error deleting camera:", error);
    }
  };

  // Toggle processing status (is_process) via API
  const handleToggleProcess = async (camera: Camera) => {
    const updatedProcessStatus = !camera.is_process;
    try {
      const response = await fetch(`/api/cameras/${camera.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_process: updatedProcessStatus }),
      });

      if (response.ok) {
        await fetchCameras();
      } else {
        alert("Failed to update process runtime state.");
      }
    } catch (error) {
      console.error("Error updating stream processing state:", error);
    }
  };

  // Open Dialog for editing and fill states
  const openEditModal = (camera: Camera) => {
    setIsEdit(true);
    setEditingCameraId(camera.id);
    setCameraScn(camera.camera_scn || "");
    setCameraName(camera.name || "");
    setSelectedSiteId(camera.site_id || "");
    setStreamUrl(camera.stream_url || "");
    setIpAddress(camera.ip_address || "");
    setPassword(""); // Leave empty for security until user re-types it
    setStartTime(camera.monitoring_start_time || "");
    setEndTime(camera.monitoring_end_time || "");
    setOpen(true);
  };

  const resetForm = () => {
    setIsEdit(false);
    setEditingCameraId(null);
    setCameraScn("");
    setCameraName("");
    setSelectedSiteId("");
    setStreamUrl("");
    setIpAddress("");
    setPassword("");
    setStartTime("");
    setEndTime("");
  };

  useEffect(() => {
    fetchCameras();
    fetchSites();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cameraData: any = {
      name: cameraName,
      camera_scn: cameraScn,
      site_id: selectedSiteId,
      stream_url: streamUrl,
      ip_address: ipAddress,
      monitoring_start_time: StartTime || null,
      monitoring_end_time: EndTime || null,
    };

    if (password) {
      cameraData.password_encrypted = password;
    }

    try {
      const url = isEdit ? `/api/cameras/${editingCameraId}` : "/api/cameras";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cameraData),
      });

      if (response.ok) {
        alert(isEdit ? "Camera updated successfully!" : "Camera added successfully!");
        await fetchCameras();
        setOpen(false);
        resetForm();
      } else {
        alert("Failed to process transaction on backend.");
      }
    } catch (error) {
      console.error("Submission operational failure:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = 
      searchQuery.trim() === "" || 
      String(camera.camera_scn).toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesSite = 
      filterSite === "All Sites" || 
      camera.site_name === filterSite;

    const mappedStatus = camera.status === "active" ? "Online" : "Offline";
    const matchesStatus = 
      filterStatus === "All Status" || 
      mappedStatus === filterStatus;

    return matchesSearch && matchesSite && matchesStatus;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera Management</h1>
            <p className="text-sm font-medium text-muted-foreground">Manage all surveillance cameras and configurations</p>
          </div>
          
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsEdit(false)}>
                <Plus size={18} className="mr-2" />
                Add Camera
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[625px] bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto border-gray-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {isEdit ? "Update Camera Configuration" : "Add New Camera"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400">
                  Fill out the technical details below to provision or update your surveillance node.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camera SCN</label>
                    <Input
                      type="text"
                      placeholder="e.g., SCN-CAM-091"
                      value={cameraScn}
                      onChange={(e) => setCameraScn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camera Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Perimeter North 01"
                      value={cameraName}
                      onChange={(e) => setCameraName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                    <select
                      className="w-full h-10 border border-gray-200 dark:border-zinc-800 rounded-md px-3 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      required
                    >
                      <option value="" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">Select Site</option>
                      {sites.map((site: any) => (
                        <option key={site.id} value={site.id} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stream URL</label>
                    <Input
                      type="text"
                      placeholder="e.g., rtsp://admin:pass@192.168.1.50:554/stream1"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                    <Input
                      type="text"
                      placeholder="e.g., 192.168.1.50"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password {isEdit && <span className="text-xs text-gray-400 dark:text-gray-500">(Leave blank to keep current)</span>}
                    </label>
                    <Input
                      type="password"
                      placeholder="e.g., Abc@123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monitoring Start Time</label>
                    <input 
                      type="time" 
                      className="w-full h-10 border border-gray-200 dark:border-zinc-800 rounded-md px-3 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={StartTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monitoring End Time</label>
                    <input
                      type="time"
                      className="w-full h-10 border border-gray-200 dark:border-zinc-800 rounded-md px-3 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={EndTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setOpen(false); resetForm(); }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? "Processing..." : isEdit ? "Update Camera" : "Save Camera"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* CONTROLS INPUT FILTER ROW */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input 
              placeholder="Search by Camera SCN ..." 
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
            <option value="All Sites" className="bg-white dark:bg-zinc-900">All Sites</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.name} className="bg-white dark:bg-zinc-900">
                {site.name}
              </option>
            ))}
          </select>

          <select 
            className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none h-10"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All Status" className="bg-white dark:bg-zinc-900">All Status</option>
            <option value="Online" className="bg-white dark:bg-zinc-900">Online</option>
            <option value="Offline" className="bg-white dark:bg-zinc-900">Offline</option>
          </select>
        </div>

        <Card className="rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Camera SCN</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Camera Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Site Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Stream URL</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {filteredCameras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No active cameras match your query criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCameras.map((camera, idx) => (
                    <tr key={camera.id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-gray-100 font-semibold max-w-[160px] truncate">
                        {camera.camera_scn || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {camera.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {camera.site_name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate font-mono" title={camera.stream_url}>
                        {camera.stream_url || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {camera.ip_address}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            camera.status === "active" 
                              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" 
                              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${camera.status === "active" ? "bg-green-500" : "bg-red-500"}`}></span>
                          {camera.status === "active" ? "Online" : "Offline"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-right space-x-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`h-8 gap-1 px-2 border ${
                            camera.is_process 
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/60" 
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                          }`}
                          onClick={() => handleToggleProcess(camera)}
                        >
                          {camera.is_process ? (
                            <>
                              <Square size={12} className="fill-amber-700 dark:fill-amber-400 stroke-none" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play size={12} className="fill-slate-700 dark:fill-zinc-300 stroke-none" />
                              <span>Process</span>
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          onClick={() => openEditModal(camera)}
                        >
                          <Edit2 size={15} />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => handleDeleteCamera(camera.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}