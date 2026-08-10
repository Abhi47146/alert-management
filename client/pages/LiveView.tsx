import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCAL_CAMERAS, LocalCamera } from "@/src/config";
import {
  Video,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  AlertCircle,
  Radio,
  GripVertical,
  Maximize2,
  X,
  ChevronsUpDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GridViewMode = "single" | "2x2" | "3x3" | "4x4";

export default function LiveView() {
  const [gridMode, setGridMode] = useState<GridViewMode>("2x2");

  // Dynamic camera order list state
  const [cameraList, setCameraList] = useState<LocalCamera[]>(LOCAL_CAMERAS);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(
    LOCAL_CAMERAS[0]?.id || "camera1"
  );
  const [failedStreams, setFailedStreams] = useState<Record<string, boolean>>({});

  // Search & Suggestion states for Camera Selection
  const [cameraSearch, setCameraSearch] = useState<string>(
    LOCAL_CAMERAS[0] ? `${LOCAL_CAMERAS[0].name} (${LOCAL_CAMERAS[0].siteName})` : ""
  );
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);

  // Enlarge modal state
  const [enlargedCamera, setEnlargedCamera] = useState<LocalCamera | null>(null);

  // Drag and drop index states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Filter cameras dynamically based on input query
  const filteredCameras = useMemo(() => {
    if (!cameraSearch.trim()) return cameraList;
    const searchTerm = cameraSearch.toLowerCase();
    return cameraList.filter(
      (cam) =>
        cam.name.toLowerCase().includes(searchTerm) ||
        cam.siteName.toLowerCase().includes(searchTerm)
    );
  }, [cameraList, cameraSearch]);

  
  const autoScrollFrame = React.useRef<number | null>(null);
  const autoScrollSpeed = React.useRef<number>(0);
  const scrollParentRef = React.useRef<HTMLElement | Window | null>(null);

  const AUTOSCROLL_EDGE_SIZE = 150; 
  const AUTOSCROLL_MAX_SPEED = 28; 

 
  const getScrollParent = (el: HTMLElement | null): HTMLElement | Window => {
    let node = el?.parentElement || null;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      const isScrollable =
        (overflowY === "auto" || overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight;
      if (isScrollable) return node;
      node = node.parentElement;
    }
    return window;
  };

  const stopAutoScroll = () => {
    if (autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
    autoScrollSpeed.current = 0;
    scrollParentRef.current = null;
  };

  const runAutoScroll = () => {
    if (autoScrollSpeed.current !== 0 && scrollParentRef.current) {
      const target = scrollParentRef.current;
      if (target === window) {
        window.scrollBy(0, autoScrollSpeed.current);
      } else {
        (target as HTMLElement).scrollTop += autoScrollSpeed.current;
      }
      autoScrollFrame.current = requestAnimationFrame(runAutoScroll);
    } else {
      autoScrollFrame.current = null;
    }
  };

  const updateAutoScroll = (clientY: number, sourceEl: HTMLElement | null) => {
    if (!scrollParentRef.current) {
      scrollParentRef.current = getScrollParent(sourceEl);
    }

    const target = scrollParentRef.current;
    const rect =
      target === window
        ? { top: 0, bottom: window.innerHeight }
        : (target as HTMLElement).getBoundingClientRect();

   
    const clampedY = Math.min(Math.max(clientY, rect.top - AUTOSCROLL_EDGE_SIZE), rect.bottom + AUTOSCROLL_EDGE_SIZE);

    let speed = 0;
    if (clampedY < rect.top + AUTOSCROLL_EDGE_SIZE) {
      const intensity = (rect.top + AUTOSCROLL_EDGE_SIZE - clampedY) / AUTOSCROLL_EDGE_SIZE;
      speed = -Math.ceil(Math.min(intensity, 1) * AUTOSCROLL_MAX_SPEED);
    } else if (clampedY > rect.bottom - AUTOSCROLL_EDGE_SIZE) {
      const intensity = (clampedY - (rect.bottom - AUTOSCROLL_EDGE_SIZE)) / AUTOSCROLL_EDGE_SIZE;
      speed = Math.ceil(Math.min(intensity, 1) * AUTOSCROLL_MAX_SPEED);
    }

    autoScrollSpeed.current = speed;

    if (speed !== 0 && autoScrollFrame.current === null) {
      autoScrollFrame.current = requestAnimationFrame(runAutoScroll);
    } else if (speed === 0 && autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
  };


  const gridRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (draggedIndex === null) return;

    const handleWindowDragOver = (e: DragEvent) => {
      updateAutoScroll(e.clientY, gridRef.current);
    };

    window.addEventListener("dragover", handleWindowDragOver);
    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      stopAutoScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedIndex]);

  const handleSelectCamera = (camera: LocalCamera) => {
    setSelectedCameraId(camera.id);
    setCameraSearch(`${camera.name} (${camera.siteName})`);
    setIsCameraDropdownOpen(false);
    if (gridMode !== "single") setGridMode("single");
  };

  const handleClearCameraSearch = () => {
    setCameraSearch("");
    setSelectedCameraId("");
    setIsCameraDropdownOpen(false);
  };

  const handleRetryStream = (camId: string) => {
    setFailedStreams((prev) => ({ ...prev, [camId]: false }));
  };

  const handleStreamError = (camId: string) => {
    setFailedStreams((prev) => ({ ...prev, [camId]: true }));
  };

  // Reorder logic: Inserts dragged camera into target slot, auto-shifting others
  const reorderCameras = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx === null || toIdx === null) return;

    setCameraList((prevList) => {
      const updatedList = [...prevList];
      const [movedCamera] = updatedList.splice(fromIdx, 1);
      updatedList.splice(toIdx, 0, movedCamera);
      return updatedList;
    });
  };

  // Drag Event Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      reorderCameras(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
    stopAutoScroll();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    stopAutoScroll();
  };

  // Visible cameras filter based on grid mode
  const getVisibleCameras = (): LocalCamera[] => {
    if (gridMode === "single") {
      const active = cameraList.find((c) => c.id === selectedCameraId);
      return active ? [active] : [cameraList[0]];
    }
    return cameraList;
  };

  const visibleCameras = getVisibleCameras();

  // Responsive Grid CSS Helper
  const getGridClasses = (mode: GridViewMode) => {
    switch (mode) {
      case "single":
        return "grid-cols-1";
      case "2x2":
        return "grid-cols-1 md:grid-cols-2";
      case "3x3":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "4x4":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2";
    }
  };

  // Show dropdown only when typed character length > 0 and open state is true
  const showSuggestions = isCameraDropdownOpen && cameraSearch.trim().length > 0;

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-500 animate-pulse" /> Live Camera Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Real-time video streams (Drag cards to adjust layout, or click enlarge to view stream full)
          </p>
        </div>

        {/* Grid Mode Controls */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 p-1.5 border border-gray-200 dark:border-zinc-800 rounded-xl self-start sm:self-auto flex-wrap">
          <Button
            variant={gridMode === "single" ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridMode("single")}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            Single
          </Button>

          <Button
            variant={gridMode === "2x2" ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridMode("2x2")}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Grid2X2 className="h-3.5 w-3.5" /> 2x2
          </Button>

          <Button
            variant={gridMode === "3x3" ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridMode("3x3")}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Grid3X3 className="h-3.5 w-3.5" /> 3x3
          </Button>

          <Button
            variant={gridMode === "4x4" ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridMode("4x4")}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> 4x4
          </Button>
        </div>
      </div>

      {/* Primary Camera Searchable Selector */}
      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex flex-col gap-1 min-w-[280px] relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Primary Focus Stream
            </label>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Type to search camera or site..."
                value={cameraSearch}
                onFocus={() => {
                  if (cameraSearch.trim()) setIsCameraDropdownOpen(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setCameraSearch(val);
                  setSelectedCameraId("");
                  setIsCameraDropdownOpen(val.trim().length > 0);
                }}
                className="h-9 pr-8 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-sm"
              />

              {cameraSearch ? (
                <button
                  type="button"
                  onClick={handleClearCameraSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronsUpDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              )}

              {/* Typed Auto-Suggestions Menu */}
              {showSuggestions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsCameraDropdownOpen(false)}
                  />

                  <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg z-20 divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredCameras.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                        No matching camera streams found
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
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-mono">
                            {camera.siteName}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Drag and Drop Grid */}
      <div ref={gridRef} className={`grid gap-4 ${getGridClasses(gridMode)}`}>
        {visibleCameras.map((camera, index) => {
          const isFailed = failedStreams[camera.id];
          const isBeingDragged = draggedIndex === index;
          const isTarget = dropTargetIndex === index && draggedIndex !== index;

          return (
            <Card
              key={camera.id}
              draggable={gridMode !== "single"}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-zinc-950 rounded-xl overflow-hidden border shadow-md flex flex-col group relative transition-all duration-200 select-none ${
                gridMode !== "single" ? "cursor-grab active:cursor-grabbing" : ""
              } ${
                isBeingDragged
                  ? "opacity-30 scale-95 border-dashed border-blue-500"
                  : isTarget
                    ? "border-2 border-blue-500 scale-[1.02] shadow-blue-500/20 shadow-lg"
                    : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Drag & Overlay Header Bar */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md rounded px-2.5 py-1 text-white text-[11px] flex items-center gap-2 font-mono border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isFailed ? "bg-red-500" : "bg-red-400"
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isFailed ? "bg-red-500" : "bg-green-500"
                      }`}
                    ></span>
                  </span>
                  {camera.name} {isFailed && <span className="text-red-400 font-bold">(Offline)</span>}
                </div>

                {/* Top Right Action Controls: Enlarge + Drag indicator */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEnlargedCamera(camera);
                    }}
                    className="bg-black/70 hover:bg-blue-600 backdrop-blur-md p-1.5 rounded border border-white/10 text-white transition-colors"
                    title="Enlarge View"
                  >
                    <Maximize2 size={13} />
                  </button>

                  {gridMode !== "single" && (
                    <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-white/80 group-hover:text-white flex items-center gap-1 text-[10px]">
                      <GripVertical size={13} />
                      <span className="hidden sm:inline">Drag to move</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stream Viewport Container */}
              <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
                {isFailed ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2 pointer-events-auto">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-xs font-medium text-zinc-300">
                      Stream Connection Failed
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[240px]">
                      {camera.streamUrl}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryStream(camera.id)}
                      className="h-7 text-[11px] mt-2 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                    >
                      Reconnect
                    </Button>
                  </div>
                ) : (
                  <iframe
                    key={`${camera.id}-${isFailed}`}
                    src={camera.streamUrl}
                    title={`Live Stream - ${camera.name}`}
                    className="w-full h-full border-0 bg-black pointer-events-none"
                    allow="autoplay; camera; microphone; fullscreen"
                    onError={() => handleStreamError(camera.id)}
                  />
                )}
              </div>

              {/* Footer Stats Bar */}
              <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-2 truncate">
                  <Video size={12} className="text-blue-400 shrink-0" />
                  <span className="truncate">{camera.siteName}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ENLARGE VIEW MODAL DIALOG */}
      <Dialog open={!!enlargedCamera} onOpenChange={(open) => !open && setEnlargedCamera(null)}>
        <DialogContent className="max-w-5xl w-[95vw] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    enlargedCamera && failedStreams[enlargedCamera.id] ? "bg-red-500" : "bg-red-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    enlargedCamera && failedStreams[enlargedCamera.id] ? "bg-red-500" : "bg-green-500"
                  }`}
                ></span>
              </span>
              {enlargedCamera?.name} - Enlarged Feed
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {enlargedCamera && (
              <iframe
                src={enlargedCamera.streamUrl}
                title={`Enlarged Feed - ${enlargedCamera.name}`}
                className="w-full h-full border-0"
                allow="autoplay; camera; microphone; fullscreen"
              />
            )}
          </div>

          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Video size={14} className="text-blue-400" />
              <span>Site Location: <strong className="text-zinc-200">{enlargedCamera?.siteName}</strong></span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}