import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapProps {
  cameras: CameraItem[];
}

export default function CameraMap({ cameras }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filter cameras with valid coordinates
  const validCameras = cameras.filter(
    (cam) =>
      typeof cam.latitude === "number" &&
      typeof cam.longitude === "number" &&
      !isNaN(cam.latitude) &&
      !isNaN(cam.longitude)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates
    const defaultCenter: [number, number] =
      validCameras.length > 0
        ? [validCameras[0].latitude, validCameras[0].longitude]
        : [17.385, 78.4867];

    // Initialize map instance if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(defaultCenter);
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add updated camera markers
    validCameras.forEach((cam) => {
      const isOnline = cam.status === "active";
      const color = isOnline ? "#10B981" : "#EF4444";

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
            <circle cx="16" cy="16" r="7" fill="white"/>
          </svg>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const popupContent = `
        <div style="padding: 4px;">
          <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0; color: #111827;">${cam.name}</h3>
          <p style="font-size: 12px; color: #4B5563; margin: 0 0 6px 0;">Site: ${
            cam.siteName || cam.site_name || "N/A"
          }</p>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; display: inline-block;"></span>
            <span style="font-size: 12px; font-weight: 600; text-transform: capitalize; color: #374151;">${cam.status}</span>
          </div>
        </div>
      `;

      L.marker([cam.latitude, cam.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Handle container resize cleanly
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, [cameras]);

  // Clean up map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm h-[450px]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Status Legend Box */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-lg text-xs space-y-1.5 pointer-events-none">
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">
          Camera Status
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-gray-600 dark:text-gray-300">
            {validCameras.filter((c) => c.status === "active").length} Online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-gray-600 dark:text-gray-300">
            {validCameras.filter((c) => c.status !== "active").length} Offline
          </span>
        </div>
      </div>
    </div>
  );
}