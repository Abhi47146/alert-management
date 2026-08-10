import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Search, UserPlus, Users, Eye } from "lucide-react";
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

interface Site {
  id: string;
  name: string;
  location_lat: number | string | null;
  location_lng: number | string | null;
  address: string | null;
  is_active: boolean;
  recipient_name?: string;
  recipient_phone?: string;
}

interface Recipient {
  id?: string;
  site_id: string;
  name: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export default function SiteManagement() {
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  // Secondary Recipient Viewer State
  const [viewingSecondaries, setViewingSecondaries] = useState<Recipient[]>([]);
  const [viewSecondariesOpen, setViewSecondariesOpen] = useState(false);
  const [viewingSiteName, setViewingSiteName] = useState("");

  // Form input states
  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");

  // Primary Recipient info states
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  // Multiple Secondary Recipients tracking state
  const [secondaryRecipients, setSecondaryRecipients] = useState<Omit<Recipient, "site_id" | "is_primary">[]>([]);

  const [loading, setLoading] = useState(false);

  // Data State matrices
  const [sites, setSites] = useState<Site[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // Table Filter States
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesRes, recipientsRes] = await Promise.all([
        fetch("/api/sites/active"),
        fetch("/api/site-recipients")
      ]);

      if (!sitesRes.ok || !recipientsRes.ok) throw new Error("Failed to pull backend data");

      const sitesData: Site[] = await sitesRes.json();
      const recipientsData: Recipient[] = await recipientsRes.json();

      setRecipients(recipientsData);

      const mergedSites = sitesData.map((site) => {
        const primaryRecipient = recipientsData.find(
          (r) => r.site_id === site.id && r.is_primary
        ) || recipientsData.find((r) => r.site_id === site.id);

        return {
          ...site,
          recipient_name: primaryRecipient ? primaryRecipient.name : "N/A",
          recipient_phone: primaryRecipient ? primaryRecipient.phone : "N/A"
        };
      });

      setSites(mergedSites);
    } catch (error) {
      console.error("Operational reading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this surveillance site?")) return;

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Site node deactivated successfully.");
        fetchData();
      } else {
        alert("Failed to deactivate site from backend database.");
      }
    } catch (error) {
      console.error("Error deleting site:", error);
    }
  };

  const openEditModal = (site: Site) => {
    setIsEdit(true);
    setEditingSiteId(site.id);
    setSiteName(site.name || "");
    setLatitude(site.location_lat?.toString() || "");
    setLongitude(site.location_lng?.toString() || "");
    setAddress(site.address || "");

    const primary = recipients.find(r => r.site_id === site.id && r.is_primary);
    setRecipientName(primary ? primary.name : "");
    setRecipientPhone(primary ? primary.phone : "");
    setRecipientEmail(primary ? primary.email : "");

    const secondaries = recipients.filter(r => r.site_id === site.id && !r.is_primary);
    setSecondaryRecipients(secondaries.map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone || "",
      email: s.email || ""
    })));

    setOpen(true);
  };

  const openViewSecondariesModal = (siteId: string, siteName: string) => {
    const secondaries = recipients.filter(r => r.site_id === siteId && !r.is_primary);
    setViewingSecondaries(secondaries);
    setViewingSiteName(siteName);
    setViewSecondariesOpen(true);
  };

  const resetForm = () => {
    setIsEdit(false);
    setEditingSiteId(null);
    setSiteName("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setRecipientName("");
    setRecipientPhone("");
    setRecipientEmail("");
    setSecondaryRecipients([]);
  };

  const addSecondaryRecipientField = () => {
    setSecondaryRecipients([...secondaryRecipients, { name: "", phone: "", email: "" }]);
  };

  const updateSecondaryRecipientField = (index: number, field: "name" | "phone" | "email", value: string) => {
    const updated = [...secondaryRecipients];
    updated[index][field] = value;
    setSecondaryRecipients(updated);
  };

  const removeSecondaryRecipientField = (index: number) => {
    setSecondaryRecipients(secondaryRecipients.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // REGEX SPACE CONSOLIDATOR AND CASE NORMALIZATION ENGINE
    const normalizedInputName = siteName.trim().replace(/\s+/g, " ").toLowerCase();

    const isDuplicate = sites.some(site => {
      const isSameSiteEntity = isEdit && site.id === editingSiteId;
      const normalizedExistingName = site.name.trim().replace(/\s+/g, " ").toLowerCase();
      return !isSameSiteEntity && normalizedExistingName === normalizedInputName;
    });

    if (isDuplicate) {
      alert(`Validation Error: A site node with the configuration layout matching "${siteName.trim()}" already exists.`);
      return;
    }

    setLoading(true);

    const siteData = {
      name: siteName.trim().replace(/\s+/g, " "),
      location_lat: latitude ? parseFloat(latitude) : null,
      location_lng: longitude ? parseFloat(longitude) : null,
      address: address || null,
      is_active: true
    };

    try {
      const siteUrl = isEdit ? `/api/sites/${editingSiteId}` : "/api/sites";
      const siteMethod = isEdit ? "PUT" : "POST";

      const siteResponse = await fetch(siteUrl, {
        method: siteMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteData),
      });

      if (!siteResponse.ok) throw new Error("Failed site entity assignment");

      const siteResult = await siteResponse.json();
      const finalSiteId = isEdit ? editingSiteId : siteResult.id;

      if (finalSiteId) {
        if (recipientName) {
          const legacyPrimary = recipients.find(r => r.site_id === finalSiteId && r.is_primary);
          const primaryPayload = {
            site_id: finalSiteId,
            name: recipientName,
            phone: recipientPhone || null,
            email: recipientEmail || null,
            is_primary: true
          };

          const pUrl = legacyPrimary ? `/api/site-recipients/${legacyPrimary.id}` : "/api/site-recipients";
          const pMethod = legacyPrimary ? "PUT" : "POST";

          await fetch(pUrl, {
            method: pMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(primaryPayload)
          });
        }

        for (const sec of secondaryRecipients) {
          if (!sec.name.trim()) continue;

          const secondaryPayload = {
            site_id: finalSiteId,
            name: sec.name,
            phone: sec.phone || null,
            email: sec.email || null,
            is_primary: false
          };

          const sUrl = sec.id ? `/api/site-recipients/${sec.id}` : "/api/site-recipients";
          const sMethod = sec.id ? "PUT" : "POST";

          await fetch(sUrl, {
            method: sMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(secondaryPayload)
          });
        }
      }

      alert(isEdit ? "Site parameters updated!" : "New Site created successfully!");
      setOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Submission operational failure:", error);
      alert("Failed to process transaction.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter((site) => {
    return searchQuery.trim() === "" ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Site Management</h1>
            <p className="text-sm font-medium text-muted-foreground">Manage all surveillance sites and configurations</p>
          </div>

          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsEdit(false)}>
                <Plus size={18} className="mr-2" />
                Add Site
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[650px] bg-white dark:bg-zinc-900 max-h-[85vh] overflow-y-auto border-gray-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {isEdit ? "Update Site Configuration" : "Add New Site Node"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400">
                  Fill out fields to provision surveillance locations and assign recipients.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Location Metadata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Perimeter North 01"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 34.0522"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., -118.2437"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Physical Address</label>
                  <Input
                    type="text"
                    placeholder="123 Security Way, Tech District"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <hr className="my-4 border-gray-100 dark:border-zinc-800" />
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Primary Site Recipient</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="+91 555 000 0000"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <Input
                      type="email"
                      placeholder="recipient@domain.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                </div>

                <hr className="my-4 border-gray-100 dark:border-zinc-800" />
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Secondary Recipients (Optional)</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSecondaryRecipientField}
                    className="h-8 border-dashed border-zinc-300 text-zinc-600 dark:text-zinc-400"
                  >
                    <UserPlus size={14} className="mr-1.5" />
                    Add Secondary Recipient
                  </Button>
                </div>

                {secondaryRecipients.length > 0 && (
                  <div className="space-y-4 max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                    {secondaryRecipients.map((sec, index) => (
                      <div key={index} className="flex gap-2 items-end border-b border-zinc-100 dark:border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <Input
                              type="text"
                              placeholder="Name"
                              value={sec.name}
                              onChange={(e) => updateSecondaryRecipientField(index, "name", e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Input
                              type="tel"
                              placeholder="Phone"
                              value={sec.phone}
                              onChange={(e) => updateSecondaryRecipientField(index, "phone", e.target.value)}
                            />
                          </div>
                          <div>
                            <Input
                              type="email"
                              placeholder="Email"
                              value={sec.email}
                              onChange={(e) => updateSecondaryRecipientField(index, "email", e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSecondaryRecipientField(index)}
                          className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

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
                    {loading ? "Processing..." : isEdit ? "Update Site" : "Save Site"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by Site Name..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Site Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Latitude</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Longitude</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Primary Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Secondary Site Recipients</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No active sites match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSites.map((site, idx) => {
                    const secondaryCount = recipients.filter(r => r.site_id === site.id && !r.is_primary).length;
                    return (
                      <tr key={site.id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100 max-w-[160px] truncate">
                          {site.name}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {site.location_lat !== null ? Number(site.location_lat).toFixed(2) : "N/A"}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {site.location_lng !== null ? Number(site.location_lng).toFixed(2) : "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <div>{site.recipient_name}</div>
                          <div className="text-xs text-gray-400 font-mono">{site.recipient_phone}</div>
                        </td>

                        {/* COLUMN SHOWING SECONDARY RECIPIENT COUNT + TOGGLE PREVIEW ACTION BUTTON */}
                        <td className="px-6 py-4 text-sm">
                          {secondaryCount > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openViewSecondariesModal(site.id, site.name)}
                              className="text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 h-8 text-xs px-2.5 font-medium"
                            >
                              <Users size={13} className="mr-1.5 text-blue-500" />
                              View {secondaryCount} Recipient{secondaryCount > 1 ? "s" : ""}
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">None Registered</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-right space-x-1 whitespace-nowrap">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            onClick={() => openEditModal(site)}
                          >
                            <Edit2 size={15} />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => handleDeleteSite(site.id)}
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

      {/* POPUP SUB-DIALOG MODAL DISPLAYING SECONDARY PROFILE DATA FIELDS */}
      <Dialog open={viewSecondariesOpen} onOpenChange={setViewSecondariesOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Secondary Contacts</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Assigned notification profiles for <span className="font-semibold text-blue-600 dark:text-blue-400">"{viewingSiteName}"</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 max-h-[50vh] overflow-y-auto space-y-3 p-1">
            {viewingSecondaries.map((rec, index) => (
              <div
                key={rec.id || index}
                className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 space-y-1"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rec.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                  <span>Phone: <strong className="font-mono">{rec.phone || "N/A"}</strong></span>
                  <span>Email: <strong className="font-sans">{rec.email || "N/A"}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" onClick={() => setViewSecondariesOpen(false)} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
              Close Display
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}