"use client";

import { useState } from "react";

interface AuthPortalProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthPortal({ onLoginSuccess }: AuthPortalProps) {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "FORGOT">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Store Owner");
  const [password, setPassword] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleModeChange = (target: "LOGIN" | "REGISTER" | "FORGOT") => {
    setMode(target);
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload =
        mode === "LOGIN"
          ? { action: "LOGIN", phone, password }
          : mode === "REGISTER"
          ? { action: "REGISTER", name, phone, role, password, recoveryPin }
          : { action: "RESET_PASSWORD", phone, recoveryPin, newPassword };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Request failed. Please verify your credentials.");
      } else {
        if (mode === "FORGOT") {
          setSuccessMsg("Password updated successfully. Redirecting to login...");
          setPassword("");
          setTimeout(() => handleModeChange("LOGIN"), 1500);
        } else {
          localStorage.setItem("sanjay_med_user", JSON.stringify(data.user));
          onLoginSuccess(data.user);
        }
      }
    } catch (err) {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5F5] flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 text-white text-2xl font-bold rounded-xl mb-3">
            +
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sanjay Medical Store</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "LOGIN" && "Sign in to manage store inventory"}
            {mode === "REGISTER" && "Create a new staff or admin account"}
            {mode === "FORGOT" && "Reset your account password"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleModeChange("LOGIN")}
            className={`py-2 text-sm font-bold rounded-lg transition ${
              mode === "LOGIN" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("REGISTER")}
            className={`py-2 text-sm font-bold rounded-lg transition ${
              mode === "REGISTER" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "REGISTER" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Mobile Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
            />
          </div>

          {mode === "REGISTER" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600 bg-white"
              >
                <option value="Store Owner">Store Owner</option>
                <option value="Admin">Admin</option>
                <option value="Pharmacist / Cashier">Pharmacist / Cashier</option>
              </select>
            </div>
          )}

          {mode !== "FORGOT" && (
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
                {mode === "LOGIN" && (
                  <button
                    type="button"
                    onClick={() => handleModeChange("FORGOT")}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border p-3 rounded-lg w-full outline-none focus:border-teal-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {(mode === "REGISTER" || mode === "FORGOT") && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {mode === "REGISTER" ? "4-Digit Recovery PIN" : "Recovery PIN (or Full Name)"}
              </label>
              <input
                type="text"
                placeholder={mode === "REGISTER" ? "Set 4-digit PIN for password reset" : "Enter recovery PIN"}
                value={recoveryPin}
                onChange={(e) => setRecoveryPin(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>
          )}

          {mode === "FORGOT" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition mt-2 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : mode === "LOGIN"
              ? "Sign In"
              : mode === "REGISTER"
              ? "Create Account"
              : "Update Password"}
          </button>

          {mode === "FORGOT" && (
            <button
              type="button"
              onClick={() => handleModeChange("LOGIN")}
              className="text-xs text-center text-gray-500 hover:text-gray-800 underline mt-1"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
}