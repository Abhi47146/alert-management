import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Loader2, Video, Search, X, Download } from "lucide-react";

interface Site {
  id: string;
  name: string;
}

interface CameraProfile {
  id: string;
  camera_scn?: string;
  name: string;
  stream_url?: string;
  ip_address?: string;
  status?: string;
  is_licensed?: boolean;
  site_id: string;
  site_name?: string;
}

interface RecordingEvent {
  id: string;
  timestamp: number;
  videoUrl: string;
  key: string;
  cameraName: string;
  formattedTime?: string;
}

export default function NVRRecordings() {
  const [sites, setSites] = useState<Site[]>([]);
  const [cameras, setCameras] = useState<CameraProfile[]>([]);

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameraSearch, setCameraSearch] = useState<string>("");
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);

  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const maxDateTime = new Date().toISOString().slice(0, 16);

  const [recordings, setRecordings] = useState<RecordingEvent[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(6);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
  const [loadingRecordings, setLoadingRecordings] = useState<boolean>(false);

  const [activeVideo, setActiveVideo] = useState<RecordingEvent | null>(null);

  const currentCamera = useMemo(() => {
    return cameras.find((c) => c.id === selectedCameraId || c.name === selectedCameraId);
  }, [cameras, selectedCameraId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitialData(true);
        const [sitesRes, camerasRes] = await Promise.all([
          fetch("/api/sites"),
          fetch("/api/kerberos-cameras"),
        ]);

        if (sitesRes.ok) setSites(await sitesRes.json());
        if (camerasRes.ok) setCameras(await camerasRes.json());
      } catch (err) {
        console.error("Failed fetching sites or camera profiles:", err);
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, []);

  // Filter cameras based on selected site AND typed text
  const filteredCameras = useMemo(() => {
    let result = cameras;

    // Filter by site if a specific site is selected
    if (selectedSiteId) {
      result = result.filter((cam) => {
        // Match either site_id or siteName/site_name text
        const selectedSiteObj = sites.find((s) => s.id === selectedSiteId);
        const selectedSiteName = selectedSiteObj ? selectedSiteObj.name.toLowerCase() : "";
        
        const camSiteId = cam.site_id ? String(cam.site_id) : "";
        const camSiteName = (cam.site_name || "").toLowerCase();

        return (
          camSiteId === selectedSiteId ||
          (selectedSiteName && camSiteName.includes(selectedSiteName))
        );
      });
    }

    // Filter by typed camera name/id text
    if (cameraSearch.trim()) {
      const searchTerm = cameraSearch.toLowerCase();
      result = result.filter((cam) => {
        const nameMatch = cam.name ? cam.name.toLowerCase().includes(searchTerm) : false;
        const idMatch = cam.id ? cam.id.toLowerCase().includes(searchTerm) : false;
        return nameMatch || idMatch;
      });
    }

    return result;
  }, [cameras, sites, selectedSiteId, cameraSearch]);

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedCameraId("");
    setCameraSearch("");
    setIsCameraDropdownOpen(false);
  };

  const handleSelectCamera = (camera: CameraProfile) => {
    setSelectedCameraId(camera.id);
    setCameraSearch(camera.name);
    setIsCameraDropdownOpen(false);
  };

  const handleClearCameraSearch = () => {
    setCameraSearch("");
    setSelectedCameraId("");
    setIsCameraDropdownOpen(false);
  };

  const handleDownloadVideo = (videoUrl: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const filename = key || "recording.mp4";
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchAgentRecordings = async () => {
    if (!selectedCameraId || !currentCamera) {
      alert("Please select a camera from the typed suggestions.");
      return;
    }
    if (!startDateTime || !endDateTime) {
      alert("Please select both From and To date & time.");
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (start >= end) {
      alert("End time must be after start time.");
      return;
    }

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      alert("Maximum search range is 7 days.");
      return;
    }

    setLoadingRecordings(true);
    setDisplayCount(6);

    try {
      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      const response = await fetch("/api/kerberos/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_name: currentCamera.name,
          payload: {
            number_of_elements: -1,
            timestamp_offset_start: startTimestamp,
            timestamp_offset_end: endTimestamp,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedEvents = data.events || [];

        const normalizedEvents = fetchedEvents.map((event: any, idx: number) => ({
          id: event.id || `${event.key}-${idx}`,
          timestamp: Number(event.timestamp),
          key: event.key,
          cameraName: currentCamera.name,
          formattedTime: `${event.day || ''} ${event.time || ''}`.trim(),
          videoUrl: `/api/kerberos/video-stream?camera_name=${encodeURIComponent(currentCamera.name)}&key=${encodeURIComponent(event.key)}`,
        }));

        setRecordings(normalizedEvents);
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error || "Failed fetching recording references"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed connecting to the backend API server.");
    } finally {
      setLoadingRecordings(false);
    }
  };

  const visibleRecordings = recordings.slice(0, displayCount);

  // Show dropdown ONLY if user typed something and menu isn't explicitly closed
  const showSuggestions = isCameraDropdownOpen && cameraSearch.trim().length > 0;

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
      <div>
        <h1 className="text-2xl font-bold">NVR Recordings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Query and play recorded video files from disk
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex gap-4 flex-wrap items-end">

          {/* Site Select */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select Site
            </label>
            {loadingInitialData ? (
              <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 h-9 px-3 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
                <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <select
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="px-3 h-9 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm text-gray-700 dark:text-gray-200"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Camera Search Input with On-Demand Suggestions */}
          <div className="flex flex-col gap-1 min-w-[240px] relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select Camera
            </label>
            {loadingInitialData ? (
              <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 h-9 px-3 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
                <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading feeds...
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type camera name (e.g., camera1)..."
                  value={cameraSearch}
                  onFocus={() => setIsCameraDropdownOpen(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCameraSearch(val);
                    setSelectedCameraId("");
                    setIsCameraDropdownOpen(true);
                  }}
                  className="h-9 pr-8 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-sm"
                />

                {cameraSearch && (
                  <button
                    type="button"
                    onClick={handleClearCameraSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Suggestions Popover (Only triggers when typing) */}
                {showSuggestions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCameraDropdownOpen(false)}
                    />

                    <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg z-20 divide-y divide-gray-100 dark:divide-zinc-800">
                      {filteredCameras.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                          No matching cameras found
                        </div>
                      ) : (
                        filteredCameras.map((camera) => (
                          <div
                            key={camera.id}
                            onClick={() => handleSelectCamera(camera)}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors flex justify-between items-center ${
                              selectedCameraId === camera.id
                                ? "bg-blue-50 dark:bg-zinc-800 font-semibold text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            <span>{camera.name}</span>
                            {camera.site_name && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                                {camera.site_name}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">From</label>
            <Input
              type="datetime-local"
              value={startDateTime}
              max={maxDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">To</label>
            <Input
              type="datetime-local"
              value={endDateTime}
              max={maxDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>

          <Button
            onClick={fetchAgentRecordings}
            disabled={loadingRecordings}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 flex items-center gap-2 rounded-lg"
          >
            {loadingRecordings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
            View Recording
          </Button>

        </div>
      </div>

      {/* Video Grid Section */}
      {loadingRecordings ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Fetching MediaMTX recording files...</p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-gray-500 text-sm">
          No recording files found for this date range. Select a range and click "View Recording".
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRecordings.map((recording) => (
              <Card
                key={recording.id}
                onClick={() => setActiveVideo(recording)}
                className="bg-zinc-950 rounded-xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-blue-500 transition-all shadow-md group relative"
              >
                <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
                  <div className="absolute top-3 left-3 bg-black/70 rounded px-2 py-1 text-white text-[11px] z-10 flex items-center gap-1 font-mono">
                    <Video size={10} className="text-red-500 fill-red-500" />
                    {recording.formattedTime || new Date(recording.timestamp * 1000).toLocaleString()}
                  </div>

                  <button
                    title="Download Recording"
                    onClick={(e) => handleDownloadVideo(recording.videoUrl, recording.key, e)}
                    className="absolute top-3 right-3 bg-black/70 hover:bg-blue-600 p-1.5 rounded text-white z-20 transition-colors border border-white/10"
                  >
                    <Download size={14} />
                  </button>

                  <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-200 z-10 shadow-lg border border-white/20">
                    <Play size={24} className="text-white fill-white ml-1" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
                    <p className="text-white text-xs font-medium truncate">{recording.key}</p>
                    <p className="text-zinc-400 text-[10px] truncate">{recording.cameraName}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {recordings.length > displayCount && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setDisplayCount((prev) => prev + 6)}
                className="px-6 py-2 border-gray-300 dark:border-zinc-700 font-medium text-sm rounded-lg"
              >
                Load More Recordings ({recordings.length - displayCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div>
                <h3 className="text-sm font-semibold text-white truncate max-w-xl">{activeVideo.key}</h3>
                <p className="text-[11px] text-zinc-400">{activeVideo.cameraName} • {activeVideo.formattedTime}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownloadVideo(activeVideo.videoUrl, activeVideo.key)}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 flex items-center gap-1.5 rounded-lg"
                >
                  <Download size={14} />
                  Download Video
                </Button>

                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                key={activeVideo.id}
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}