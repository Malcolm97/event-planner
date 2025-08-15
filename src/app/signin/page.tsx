"use client";
import { useState, useEffect } from "react";
import { supabase, TABLES } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || "",
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create user profile
          const userProfile = {
            id: data.user.id,
            name: name || "",
            company: company || "",
            phone: phone || "",
            about: about || "",
            updated_at: new Date().toISOString(),
          };

          // Insert into users table
          const { error: profileError } = await supabase
            .from(TABLES.USERS)
            .insert([userProfile]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

          // Insert into users_by_email table
          const emailKey = email.replace(/\./g, ',');
          const { error: emailError } = await supabase
            .from(TABLES.USERS_BY_EMAIL)
            .insert([{
              email: emailKey,
              user_id: data.user.id,
              ...userProfile
            }]);

          if (emailError) {
            console.error('Error creating email record:', emailError);
          }

          setError("");
          alert("Account created successfully! Please check your email for verification.");
          router.push("/dashboard");
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center text-gray-900 hover:text-yellow-400 text-sm font-medium gap-2 bg-white bg-opacity-90 px-3 py-2 rounded-lg">
          <FiArrowLeft className="text-lg" />
          Back to Events
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 tracking-tight">
          Welcome to PNG Events
        </h2>
        <p className="text-center text-gray-500 text-base mb-2">Sign in to discover and create amazing events</p>
        {/* Tabs */}
        <div className="flex mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <button
            type="button"
            className={`flex-1 py-2 text-lg font-semibold transition-colors duration-150 ${!isRegister ? "bg-white text-gray-900" : "text-gray-400"}`}
            onClick={() => setIsRegister(false)}
            tabIndex={0}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-lg font-semibold transition-colors duration-150 ${isRegister ? "bg-white text-gray-900" : "text-gray-400"}`}
            onClick={() => setIsRegister(true)}
            tabIndex={0}
          >
            Register
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {isRegister ? (
            <>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder={isRegister ? "Create a password" : "Enter your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </>
          )}
        </div>
        {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold text-lg shadow-md hover:bg-yellow-500 transition disabled:opacity-50 mt-2"
        >
          {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
