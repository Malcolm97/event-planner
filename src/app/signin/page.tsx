"use client";
import { useState, useEffect } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import { FiArrowLeft } from "react-icons/fi";
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import SuccessModal from '@/components/SuccessModal';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const { isOnline } = useNetworkStatus(); // Get the network status

  // If offline, show a message and a back button
  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
        <div className="relative flex flex-1 items-center justify-center p-4">
          <div className="absolute top-6 left-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <FiArrowLeft className="text-lg" />
              Back to Events
            </Link>
          </Button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 tracking-tight">
              Welcome to PNG Events
            </h2>
            <p className="text-center text-gray-500 text-base mb-2">Sign in to discover and create amazing events</p>
            <div className="text-center text-gray-600">Sign-in and registration are not available when offline.</div>
          </div>
        </div>
      </div>
    );
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New state for forgot password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for modal visibility
  const [successMessage, setSuccessMessage] = useState(""); // New state for success message
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
        console.log('Name state:', name); // Debugging: Log name state
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
          console.log('Supabase user data after signup:', data.user); // Debugging: Log user data
          // Create user profile
          const userProfile = {
            id: data.user.id,
            company: company || "",
            phone: phone || "",
            about: about || "",
            updated_at: new Date().toISOString(),
          };

          console.log('UserProfile object before insertion:', userProfile); // Debugging: Log userProfile
          // Insert into users table
          const { error: profileError } = await supabase
            .from(TABLES.USERS)
            .insert([userProfile]);

          if (profileError) {
            console.error('Error creating profile:', JSON.stringify(profileError));
          }

          // Insert into users_by_email table
          const emailKey = email.replace(/\./g, ',');
          const { error: emailError } = await supabase
            .from(TABLES.USERS_BY_EMAIL)
            .insert([{
              email: emailKey,
              user_id: data.user.id,
              ...userProfile,
              name: name || "", // Add name here for users_by_email if needed for search/display
            }]);

          if (emailError) {
            console.error('Error creating email record:', JSON.stringify(emailError));
          }

          setError("");
          setSuccessMessage("Account created successfully! Please check your email for verification.");
          setShowSuccessModal(true); // Show the success modal
        }
      } else if (isForgotPassword) {
        // Forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard/update-password` : '/dashboard/update-password',
        });

        if (error) throw error;

        setSuccessMessage("Password reset email sent! Please check your inbox.");
        setShowSuccessModal(true);
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
      let errorMessage = "An unexpected error occurred.";
      if (err.message) {
        if (err.message.includes("User already registered")) {
          errorMessage = "This email is already registered. Please sign in or use a different email.";
        } else if (err.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // If it was a registration, redirect to signin. If forgot password, stay on signin.
    if (successMessage.includes("Account created")) {
      router.push("/signin");
    }
    setSuccessMessage(""); // Clear success message
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <FiArrowLeft className="text-lg" />
              Back to Events
            </Link>
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">PNG</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          Welcome to PNG Events
        </h2>
          <p className="text-gray-600 text-lg">Sign in to discover and create amazing events</p>
        </div>
        
        {/* Tabs */}
        <div className="flex mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1">
          <Button
            type="button"
            variant={!isRegister && !isForgotPassword ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => { setIsRegister(false); setIsForgotPassword(false); setError(""); }}
            tabIndex={0}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={isRegister ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => { setIsRegister(true); setIsForgotPassword(false); setError(""); }}
            tabIndex={0}
          >
            Register
          </Button>
        </div>
        
        <div className="flex flex-col gap-5">
          {isForgotPassword ? (
            <>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-blue-800 text-sm font-medium">Enter your email to receive a password reset link.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />
              </div>
            </>
          ) : isRegister ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                required
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                required
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setIsForgotPassword(true); setIsRegister(false); setError(""); }}
                className="text-sm text-yellow-600 hover:text-yellow-700 self-end font-medium p-0 h-auto"
              >
                Forgot Password?
              </Button>
              </div>
            </>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium text-center">{error}</p>
          </div>
        )}
        
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          fullWidth
        >
          {loading ? "Loading..." : isForgotPassword ? "Send Reset Link" : (isRegister ? "Create Account" : "Sign In")}
        </Button>
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
