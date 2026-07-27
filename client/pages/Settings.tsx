import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface Role {
  id: string; 
  name: string;
}

interface ExistingUser {
  id: string;
  name: string;
  email: string;
  role_name: string;
  created_by_name: string; 
}

// Interface to parse local storage payload accurately
interface LocalStorageUser {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role_name: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  "Super Admin": 1, // Super Admin
  "Admin": 2, // Admin
  "Operator": 3, // Operator
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<LocalStorageUser | null>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedCreatedById, setSelectedCreatedById] = useState("");

  // States matrices
  const [roles, setRoles] = useState<Role[]>([]);
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadConfigurationData = async () => {
    try {
      const rolesResponse = await fetch("/api/roles");
      if (rolesResponse.ok) setRoles(await rolesResponse.json());

      const usersResponse = await fetch("/api/users/active");
      if (usersResponse.ok) setExistingUsers(await usersResponse.json());
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  };

  useEffect(() => {
    loadConfigurationData();

    // Fetch user exactly how Layout does it
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
        // Automatically default 'Created By' state to current user's ID
        if (parsedUser?.id) {
          setSelectedCreatedById(parsedUser.id);
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
      }
    }
  }, []);

  // Filter out any role that ranks above the logged-in user's authorization weight
  const filteredRoles = useMemo(() => {
    if (!currentUser) return [];

    const currentUserWeight = ROLE_HIERARCHY[currentUser.role_id] || 99; // Fallback to lowest clearance if undefined

    return roles.filter((role) => {
      const targetRoleWeight = ROLE_HIERARCHY[role.id] || 99;
      // Allow creation of roles matching current user clearance tier or weaker (numerically higher)
      return targetRoleWeight >= currentUserWeight;
    });
  }, [roles, currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name,
      email,
      password,
      role_id: selectedRoleId,
      created_by: selectedCreatedById || null, 
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setMessage({ type: "success", text: "User provisioned successfully!" });
        setName("");
        setEmail("");
        setPassword("");
        setSelectedRoleId("");
        // Retain the current logged-in user ID as the authorizer for consecutive submissions
        setSelectedCreatedById(currentUser?.id || "");
        
        await loadConfigurationData();
        setTimeout(() => {
          setActiveTab("list");
          setMessage(null);
        }, 1500);
      } else {
        throw new Error(data.message || "Failed to finalize account allocation.");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user "${userName}"?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExistingUsers((prev) => prev.filter((user) => user.id !== userId));
        alert("User account dropped successfully.");
      } else {
        alert("Server validation error processing request.");
      }
    } catch (error) {
      console.error("Deletion cycle failure:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm font-medium text-muted-foreground">Configure system preferences and user privileges</p>
        </div>

        <div className="flex border-b border-gray-200 dark:border-zinc-800 gap-4">
          <button
            onClick={() => { setActiveTab("list"); setMessage(null); }}
            className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-all ${
              activeTab === "list" 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Users size={16} />
            Manage Current Users
          </button>
          
          <button
            onClick={() => { setActiveTab("create"); setMessage(null); }}
            className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-all ${
              activeTab === "create" 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <UserPlus size={16} />
            Create New User
          </button>
        </div>

        {message && (
          <div className={`p-3 border rounded-lg text-sm font-medium ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400" 
              : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === "list" && (
          <Card className="rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <th className="px-6 py-3">User Name</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Authorized By</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {existingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                        No system users registered in the database.
                      </td>
                    </tr>
                  ) : (
                    existingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
                            {user.role_name || "Unassigned"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.created_by_name || "System"}</td>
                        <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "create" && (
          <Card className="rounded-xl p-6 max-w-2xl shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Provision User Account</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Fill out authorization parameters to assign credentials.</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <Input
                  type="password"
                  placeholder="Create high entropy security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Role</label>
                  <select
                    className="w-full h-11 border border-gray-200 dark:border-zinc-800 rounded-md p-2 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    required
                  >
                    <option value="" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">Select Role Assignment</option>
                    {filteredRoles.map((role) => (
                      <option key={role.id} value={role.id} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created By</label>
                  <select
                    disabled
                    className="w-full h-11 border border-gray-200 dark:border-zinc-800 rounded-md p-2 bg-gray-50 dark:bg-zinc-800/30 text-sm focus:outline-none text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    value={selectedCreatedById}
                    onChange={(e) => setSelectedCreatedById(e.target.value)}
                  >
                    {currentUser ? (
                      <option value={currentUser.id}>{currentUser.name} (You)</option>
                    ) : (
                      <option value="">Select Authorizing User</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold px-6 h-11"
                >
                  {loading ? "Provisioning..." : "Create User Account"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  );
}