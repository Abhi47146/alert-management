import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(""); // Add an explicit error state
    const [loading, setLoading] = useState(false); // Add a loading state

    const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true); // Start loading spinner/status

    try {
        const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to send reset link");
        }

        setMessage(data.message); 
    } catch (error) {
        console.error("Forgot Password Error:", error);
        setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
        setLoading(false); // Stop loading
    }
    };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">DRISHYAM</h1>
              <p className="text-blue-200 text-sm">AI Surveillance & Analytics</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
              <div className="flex items-start gap-4 mb-4">
                <svg
                  className="w-8 h-8 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Relay Room Monitoring</h3>
                  <p className="text-sm text-blue-100">24/7 Real-time Surveillance</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>150+ Cameras</span>
                  <span className="font-semibold">98% Uptime</span>
                </div>
                <div>24/7 Active</div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
              <div className="flex items-start gap-4 mb-4">
                <svg
                  className="w-8 h-8 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Solar Site Security</h3>
                  <p className="text-sm text-blue-100">Perimeter Intrusion Detection</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>AI Detection Accuracy</span>
                  <div className="w-24 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400" style={{ width: "95%" }}></div>
                  </div>
                </div>
                <span>95%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 19c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <span>Enterprise Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 19c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <span>AI-Powered Analytics</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="max-w-md mx-auto mt-20">
            <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>

            <form onSubmit={handleSubmit}>
                <input
                type="email"
                placeholder="Enter your email"
                className="w-full border rounded-lg p-3 mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />

                <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-lg"
                >
                Send Reset Link
                </button>
                {message && (
                <p className="mt-3 text-green-600 text-center font-medium">
                {message}
                </p>)}
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 19c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            Government-Grade Secure Authentication
          </p>

          <p className="text-center text-sm text-gray-600 mt-6">
            Need help? Contact{" "}
            <a href="mailto:support@drishyam.com" className="text-blue-600 hover:text-blue-700 font-medium">
              support@drishyam.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
