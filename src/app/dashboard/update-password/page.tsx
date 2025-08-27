"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import SuccessModal from '@/components/SuccessModal';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if there's an access token in the URL (from the password reset email)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          // If session is null (e.g., user is not signed in or signed out), redirect to signin
          router.push("/signin");
        }
        // No specific check for 'PASSWORD_RECOVERED' event needed here,
        // as the user will already be signed in by Supabase when redirected from the reset email.
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccessMessage("Your password has been updated successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push("/dashboard"); // Redirect to dashboard after successful password update
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
      <Header />
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Link href="/" className="flex items-center text-gray-900 hover:text-yellow-400 text-sm font-medium gap-2 bg-white bg-opacity-90 px-3 py-2 rounded-lg">
            <FiArrowLeft className="text-lg" />
            Back to Events
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 tracking-tight">
            Update Your Password
          </h2>
          <p className="text-center text-gray-500 text-base mb-2">Enter your new password below.</p>
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold text-lg shadow-md hover:bg-yellow-500 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Loading..." : "Update Password"}
          </button>
        </form>
      </div>
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={handleCloseSuccessModal}
        />
      )}
    </div>
  );
}
