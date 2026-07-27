import Layout from "@/components/Layout";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Grid2X2, Grid3X3, LayoutList, Loader2, SlidersHorizontal } from "lucide-react";

const KERBEROS_AGENTS = [
  { id: "agent-1", name: "Relay Room - Entry Gate", ip: "192.168.1.50", port: "80" },
  { id: "agent-2", name: "Solar Farm - Perimeter North", ip: "192.168.1.51", port: "80" },
  { id: "agent-3", name: "Relay Room - Control Panel", ip: "192.168.1.52", port: "80" },
];

interface KerberosEvent {
  id: string;
  timestamp: number;
  videoUrl: string;
  key: string;
  cameraName: string;
}

export default function NVRRecordings() {
  const [date, setDate] = useState<Date | null>(null);
  
  // Configuration State
  const [selectedAgentId, setSelectedAgentId] = useState(KERBEROS_AGENTS[0].id);
  const [elementsCount, setElementsCount] = useState<number>(5);
  const [offsetStart, setOffsetStart] = useState<number>(4000);
  const [offsetEnd, setOffsetEnd] = useState<number>(0);

  // Core Data States
  const [recordings, setRecordings] = useState<KerberosEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<KerberosEvent | null>(null);

  const currentAgent = KERBEROS_AGENTS.find(a => a.id === selectedAgentId) || KERBEROS_AGENTS[0];

  // Request pipeline fetching events from the Python Flask back-end
  const fetchAgentRecordings = async () => {
    setLoading(true);
    try {
      // Update with your local/production Flask application base URL if needed
      const response = await fetch("http://localhost:5000/api/kerberos/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: currentAgent.ip,
          port: currentAgent.port,
          payload: {
            number_of_elements: elementsCount,
            timestamp_offset_end: offsetEnd,
            timestamp_offset_start: offsetStart
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedEvents = data.events || data || [];
        
        const normalizedEvents = fetchedEvents.map((event: any, idx: number) => ({
          id: event.id || `${event.key}-${idx}`,
          timestamp: event.timestamp || Date.now(),
          key: event.key,
          cameraName: currentAgent.name,
          videoUrl: `http://${currentAgent.ip}:${currentAgent.port}/files/${event.key}.mp4`
        }));

        setRecordings(normalizedEvents);
        
        if (normalizedEvents.length > 0) {
          setActiveVideo(normalizedEvents[0]);
        } else {
          setActiveVideo(null);
        }
      }
    } catch (err) {
      console.error("Communication issue linking Flask runtime:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-query API when config changes
  useEffect(() => {
    fetchAgentRecordings();
  }, [selectedAgentId, elementsCount, offsetStart, offsetEnd]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NVR & Recordings</h1>
          <p className="text-gray-600 text-sm">Monitor cluster logs and query streams on edge networks</p>
        </div>

        {/* Filters Top Bar Control Panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Active Agent Profile</label>
              <select 
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 font-medium outline-none focus:border-blue-500 shadow-sm"
              >
                {KERBEROS_AGENTS.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Elements Count</label>
              <Input 
                type="number" 
                value={elementsCount} 
                onChange={(e) => setElementsCount(Number(e.target.value))} 
                className="w-24 h-9" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Offset Start</label>
              <Input 
                type="number" 
                value={offsetStart} 
                onChange={(e) => setOffsetStart(Number(e.target.value))} 
                className="w-28 h-9" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Offset End</label>
              <Input 
                type="number" 
                value={offsetEnd} 
                onChange={(e) => setOffsetEnd(Number(e.target.value))} 
                className="w-24 h-9" 
              />
            </div>

            <div className="flex gap-2 ml-auto mt-4">
              <Button variant="outline" size="icon"><Grid2X2 size={18} /></Button>
              <Button variant="outline" size="icon"><Grid3X3 size={18} /></Button>
              <Button variant="outline" size="icon"><LayoutList size={18} /></Button>
            </div>
          </div>
        </div>

        {/* Dynamic Video Grid Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Requesting clip updates through Flask backend...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border text-gray-400 text-sm">
            No dynamic media references matched this custom offset configuration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((recording) => (
              <Card 
                key={recording.id} 
                onClick={() => setActiveVideo(recording)}
                className={`bg-black rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                  activeVideo?.id === recording.id ? "border-blue-500 scale-[1.01]" : "border-transparent"
                }`}
              >
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center group">
                  <div className="absolute top-3 left-3 bg-black/60 rounded px-2 py-1 text-white text-[11px] z-10">
                    {new Date(recording.timestamp * 1000).toLocaleTimeString()}
                  </div>
                  <Play size={32} className="text-white opacity-70 group-hover:opacity-100 transition-opacity z-10" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
                    <p className="text-white text-xs font-medium truncate">{recording.key}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Central Display Frame Viewport */}
        <Card className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="bg-gray-950 rounded-lg overflow-hidden h-[400px] flex items-center justify-center mb-4">
            {activeVideo ? (
              <video 
                key={activeVideo.id} 
                src={activeVideo.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Play size={48} className="mx-auto text-gray-700 mb-2" />
                <p className="text-sm">Select an active segment above to begin streaming playback.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}