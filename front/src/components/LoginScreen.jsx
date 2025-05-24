
import React, { useState } from "react";
import { Car } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LoginScreen = () => {
  const [credentials, setCredentials] = useState({ username: "", email: "", password_hash: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(credentials);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-sm">
            <Car className="h-8 w-8 text-gray-800" />
          </div>
          <h2 className="mt-6 text-3xl font-light text-gray-900">Vehicle Management</h2>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              className="w-full px-4 py-2 border-b border-gray-300 bg-transparent"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-4 py-2 border-b border-gray-300 bg-transparent"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full px-4 py-2 border-b border-gray-300 bg-transparent"
              value={credentials.password_hash}
              onChange={(e) => setCredentials({ ...credentials, password_hash: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
