import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/security-check");
    } catch (e) {
      if (e.message && e.message.includes("Device limit reached")) {
        setError(e.message);
      } else if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError("Failed to log in. Please check your credentials.");
      }
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background text-primary font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/icon-192.png"
            alt="Logo"
            className="w-16 h-16 mb-4 rounded-xl shadow-lg shadow-black/20"
          />
          <h2 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-sm text-center mt-2">
            Sign in to access your tasks
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-muted-foreground"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-primary outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yours@example.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-muted-foreground"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-primary outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
