import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Phone, Clock } from "lucide-react";

export default function SiteMonitoring() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Monitoring</h1>
          <p className="text-gray-600 text-sm">Comprehensive site-level surveillance overview</p>
        </div>

        {/* Relay Room Monitoring */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Relay Room Monitoring</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { name: "Relay Station A", cameras: 8, monitoring: "24/7", status: "Online" },
              { name: "Relay Station C", cameras: 6, monitoring: "24/7", status: "Online" },
            ].map((station, idx) => (
              <Card key={idx} className="bg-black text-white rounded-xl overflow-hidden">
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center group">
                  <div className="absolute top-3 left-3 bg-black bg-opacity-50 rounded px-3 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-white text-xs font-medium">Online</span>
                  </div>
                  <Play size={48} className="text-gray-600" />
                  <div className="absolute top-3 right-3 bg-red-500 rounded-full px-2 py-1">
                    <span className="text-white text-xs font-bold">● LIVE</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-3">{station.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Cameras</p>
                      <p className="text-2xl font-bold">{station.cameras}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Monitoring</p>
                      <p className="text-2xl font-bold">{station.monitoring}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Alert Contacts</h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>☎ +91 98765 43210</p>
                    <p>☎ +91 98765 43211</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={14} />
                    <span>Last Alert: 2 hours ago</span>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-700">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Play size={16} className="mr-2" />
                    View All
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white p-6 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Cameras</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">14</p>
              </div>
              <div className="text-4xl text-blue-200">🎥</div>
            </div>
          </Card>

          <Card className="bg-white p-6 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Monitoring</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">24/7</p>
              </div>
              <div className="text-4xl text-green-200">✓</div>
            </div>
          </Card>

          <Card className="bg-white p-6 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">System Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">Operational</p>
              </div>
              <div className="text-4xl text-green-200">●</div>
            </div>
          </Card>
        </div>

        {/* Site Details Table */}
        <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-lg">Site Details</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Site Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cameras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Monitoring</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Alert Contacts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                {
                  location: "Relay Station A",
                  cameras: 8,
                  monitoring: "24/7",
                  status: "Online",
                  contacts: "+91 98765 43210\n+91 98765 43211",
                  lastAlert: "2 hours ago",
                },
                {
                  location: "Relay Station C",
                  cameras: 6,
                  monitoring: "24/7",
                  status: "Online",
                  contacts: "+91 98765 43212",
                  lastAlert: "5 hours ago",
                },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.cameras}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.monitoring}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-2 text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-700"></span>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-pre-line">
                    <Phone size={14} className="inline mr-2" />
                    {row.contacts}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.lastAlert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Layout>
  );
}
