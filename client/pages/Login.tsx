import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Form & Authentication State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans overflow-hidden">
      {/* 60% Left side - Branding & Hero */}
      <div className="hidden lg:flex w-[60%] bg-gradient-to-br from-[#0a1e3b] via-[#0e356e] to-[#2563eb] text-white p-16 flex-col justify-between relative">
        
        {/* Top Logo Badge & Brand Name */}
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center p-3 shadow-2xl shadow-blue-900/50">
            <img
              src="/favicon.ico"
              alt="Drishyam Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-white leading-tight">
              DRISHYAM
            </h1>
            <p className="text-[11px] font-semibold text-blue-200/80 tracking-[0.2em] uppercase mt-1">
              AI SURVEILLANCE PLATFORM
            </p>
          </div>
        </div>

        {/* Center Main Heading */}
        <div className="my-auto z-10 space-y-1 pl-2">
          <h2 className="text-5xl font-semibold text-white tracking-tight">
            Welcome to
          </h2>
          <h2 className="text-5xl font-extrabold text-white tracking-tight">
            DRISHYAM
          </h2>
        </div>

        {/* Ambient Glow Gradient Effect */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[450px] h-[450px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* 40% Right side - Login Form */}
      <div className="w-full lg:w-[40%] bg-[#f8fafc] flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Header with Dual Logos (DRISHYAM and ITS PE) */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.ico"
                alt="Drishyam Logo"
                className="h-8 w-8 object-contain"
              />
              <img
                src="/logo.jpg" // Make sure to replace with your actual ITS PE logo image path
                alt="ITS PE Logo"
                className="h-8 object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-wider text-gray-900">
              DRISHYAM
            </span>
          </div>

          {/* Login Card Container */}
          <div className="w-full bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome Back
              </h2>
              <p className="text-xs text-gray-400">
                Sign in to access your fleet operations dashboard
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                /* ADDED: text-gray-900 */
                className="h-11 bg-[#f1f5f9] text-gray-900 border-none rounded-lg text-xs placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  /* ADDED: text-gray-900 */
                  className="h-11 bg-[#f1f5f9] text-gray-900 border-none rounded-lg text-xs placeholder:text-gray-400 pr-9 focus-visible:ring-2 focus-visible:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  className="w-4 h-4 border-gray-300 rounded data-[state=checked]:bg-blue-600"
                />
                <label
                  htmlFor="remember"
                  className="text-gray-600 cursor-pointer font-medium text-xs"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-blue-500 hover:text-blue-600 font-semibold text-xs"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#3b82f6] hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm text-xs mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          </div>

          {/* Footer Contact Text */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Need help? Contact{" "}
            <a
              href="mailto:support@drishyam.com"
              className="text-blue-500 hover:underline font-medium"
            >
              support@drishyam.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}