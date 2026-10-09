import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Loader2, Video, Search, X, Download, ChevronDown, Calendar } from "lucide-react";

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

// Convert YYYY-MM-DDTHH:mm to DD/MM/YYYY HH:mm
const formatToDDMMYYYY = (isoString: string) => {
  if (!isoString) return "";
  const [datePart, timePart] = isoString.split("T");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}${timePart ? ` ${timePart}` : ""}`;
};

// Convert ISO date or timestamp to DD/MM/YYYY HH:mm:ss
const formatTimestampToDDMMYYYY = (timestampSec: number) => {
  const date = new Date(timestampSec * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default function NVRRecordings() {
  const [sites, setSites] = useState<Site[]>([]);
  const [cameras, setCameras] = useState<CameraProfile[]>([]);
  const startPickerRef = React.useRef<HTMLInputElement>(null);
  const endPickerRef = React.useRef<HTMLInputElement>(null);

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameraSearch, setCameraSearch] = useState<string>("");
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);

  // ISO raw values for backend queries
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

  // Strict Filter: Filters camera options dynamically as user types
  const filteredCameras = useMemo(() => {
    let result = cameras;

    if (selectedSiteId) {
      result = result.filter((cam) => {
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

    if (cameraSearch.trim()) {
      const searchTerm = cameraSearch.toLowerCase().trim();
      // Filter ONLY by camera name
      result = result.filter((cam) =>
        cam.name ? cam.name.toLowerCase().includes(searchTerm) : false
      );
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

  const handleClearCameraSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      alert("Please select a valid camera from the options.");
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
          formattedTime: formatTimestampToDDMMYYYY(Number(event.timestamp)),
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

  return (
    <div className="w-full space-y-6 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
      <div>
        <h1 className="text-2xl font-bold">NVR Recordings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Query and play recorded video files from disk
        </p>
      </div>

      {/* Controls Container: Full Width Responsive Grid */}
      <div className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end w-full">

          {/* Site Select */}
          <div className="flex flex-col gap-1 w-full">
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
                className="w-full px-3 h-9 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm text-gray-700 dark:text-gray-200"
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

          {/* Searchable + Clickable Dropdown Camera Field */}
          <div className="flex flex-col gap-1 w-full relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select Camera
            </label>
            {loadingInitialData ? (
              <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 h-9 px-3 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
                <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading feeds...
              </div>
            ) : (
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Type to filter camera..."
                  value={cameraSearch}
                  onClick={() => setIsCameraDropdownOpen(true)}
                  onFocus={() => setIsCameraDropdownOpen(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCameraSearch(val);
                    setSelectedCameraId("");
                    setIsCameraDropdownOpen(true);
                  }}
                  className="w-full h-9 pr-8 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-sm cursor-pointer"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400">
                  {cameraSearch && (
                    <button
                      type="button"
                      onClick={handleClearCameraSearch}
                      className="hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <ChevronDown
                    size={16}
                    className={`cursor-pointer transition-transform ${
                      isCameraDropdownOpen ? "rotate-180" : ""
                    }`}
                    onClick={() => setIsCameraDropdownOpen(!isCameraDropdownOpen)}
                  />
                </div>

                {/* Dynamic Dropdown Options List */}
                {isCameraDropdownOpen && (
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
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors ${
                              selectedCameraId === camera.id
                                ? "bg-blue-50 dark:bg-zinc-800 font-semibold text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {camera.name}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* From Date Picker */}
          <div className="flex flex-col gap-1 w-full relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              From (DD/MM/YYYY)
            </label>
            <div
              className="relative w-full cursor-pointer"
              onClick={() => startPickerRef.current?.showPicker()}
            >
              <Input
                type="text"
                readOnly
                placeholder="DD/MM/YYYY HH:mm"
                value={formatToDDMMYYYY(startDateTime)}
                className="w-full h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-sm cursor-pointer pr-8"
              />
              <Input
                ref={startPickerRef}
                type="datetime-local"
                value={startDateTime}
                max={maxDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="sr-only"
              />
              <Calendar
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* To Date Picker */}
          <div className="flex flex-col gap-1 w-full relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              To (DD/MM/YYYY)
            </label>
            <div
              className="relative w-full cursor-pointer"
              onClick={() => endPickerRef.current?.showPicker()}
            >
              <Input
                type="text"
                readOnly
                placeholder="DD/MM/YYYY HH:mm"
                value={formatToDDMMYYYY(endDateTime)}
                className="w-full h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-sm cursor-pointer pr-8"
              />
              <Input
                ref={endPickerRef}
                type="datetime-local"
                value={endDateTime}
                max={maxDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="sr-only"
              />
              <Calendar
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <Button
            onClick={fetchAgentRecordings}
            disabled={loadingRecordings}
            className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 flex items-center justify-center gap-2 rounded-lg"
          >
            {loadingRecordings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
            View Recording
          </Button>

        </div>
      </div>

      {/* Video Grid Section */}
      {loadingRecordings ? (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Fetching MediaMTX recording files...</p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="w-full text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-gray-500 text-sm">
          No recording files found for this date range. Select a range and click "View Recording".
        </div>
      ) : (
        <div className="w-full space-y-6">
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
                    {recording.formattedTime}
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