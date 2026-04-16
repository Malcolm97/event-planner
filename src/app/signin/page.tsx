"use client";
import { useState, useEffect } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import { FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { validatePassword } from '@/lib/validation';

import { getSigninRedirect, getSigninModalState, clearSigninRedirect, ModalState, safeRedirect } from '@/lib/utils';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const { isOnline } = useNetworkStatus(); // Get the network status

  // All hooks must be called at the top level, before any conditional returns
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New state for forgot password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'both' | 'none'>('both');
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for modal visibility
  const [successMessage, setSuccessMessage] = useState(""); // New state for success message
  const [hasPendingRedirect, setHasPendingRedirect] = useState(false);
  const router = useRouter();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const getPasswordStrength = (value: string) => {
    if (!value) return { label: 'Enter a password', score: 0, color: 'text-gray-500' };

    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) return { label: 'Weak password', score, color: 'text-red-600' };
    if (score <= 2) return { label: 'Fair password', score, color: 'text-amber-600' };
    if (score === 3) return { label: 'Good password', score, color: 'text-blue-600' };
    return { label: 'Strong password', score, color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordValidation = validatePassword(password);
  const modeTitle = isForgotPassword ? "Reset your password" : isRegister ? "Create your account" : "Welcome to PNG Events";
  const modeSubtitle = isForgotPassword
    ? "We will email you a secure reset link."
    : isRegister
      ? "Create an account to publish events and manage your profile."
      : "Sign in to discover, save, and create events.";

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const redirectUrl = getSigninRedirect();
        if (redirectUrl) {
          clearSigninRedirect();
          safeRedirect(redirectUrl, router);
          return;
        }
        router.push("/dashboard");
      }

      setHasPendingRedirect(Boolean(getSigninRedirect()));
    };
    checkUser();
  }, [router]);

  // If offline, show a message and a back button
  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
        <div className="relative flex flex-1 items-center justify-center p-4">
          <div className="absolute top-6 left-6">
            <Link href="/" className="back-button">
              <FiArrowLeft className="text-lg" />
              Back to Events
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
            <h2 className="page-title text-center mb-1 text-gray-900">
              Welcome to PNG Events
            </h2>
            <p className="page-subtitle text-center text-gray-500 mb-2">Sign in to discover and create events</p>
            <div className="page-subtitle text-center text-gray-600">Sign-in and registration are not available when offline.</div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailError("");
    setConfirmPasswordError("");

    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setEmailError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      setConfirmPasswordError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate registration fields
    if (isRegister) {
      if (!name.trim()) {
        setError("Full name is required");
        setLoading(false);
        return;
      }
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors[0] || "Please choose a stronger password.");
        setLoading(false);
        return;
      }
    }

    // Validate sign in fields
    if (!isRegister && !isForgotPassword) {
      if (!password) {
        setError("Password is required");
        setLoading(false);
        return;
      }
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
            contact_method: contactMethod,
            whatsapp_number: whatsappNumber || null,
            contact_visibility: true,
            updated_at: new Date().toISOString(),
          };

          // Create or update the initial profile so repeated signup retries do not fail.
          const { error: profileError } = await supabase
            .from(TABLES.USERS)
            .upsert([userProfile], { onConflict: 'id' });

          if (profileError) {
            console.error('Error creating profile:', JSON.stringify(profileError));
          }

          setError("");

          // Check if we should redirect after registration
          const redirectUrl = getSigninRedirect();
          if (redirectUrl) {
            setSuccessMessage("Account created successfully! Please check your email for verification. You will be redirected after signing in.");
          } else {
            setSuccessMessage("Account created successfully! Please check your email for verification.");
          }

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

        // Check for stored redirect URL and modal state
        const redirectUrl = getSigninRedirect();
        const modalState = getSigninModalState();

        if (redirectUrl) {
          clearSigninRedirect();

          // If there's modal state, pass it as query parameters
          if (modalState) {
            const params = new URLSearchParams();
            params.set('modalState', JSON.stringify(modalState));
            safeRedirect(`${redirectUrl}?${params.toString()}`, router);
          } else {
            safeRedirect(redirectUrl, router);
          }
        } else {
          safeRedirect('/dashboard', router);
        }
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

  const switchMode = (mode: 'signin' | 'register' | 'forgot') => {
    setIsRegister(mode === 'register');
    setIsForgotPassword(mode === 'forgot');
    setError('');
    setEmailError('');
    setConfirmPasswordError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-5">
        <div className="absolute top-6 left-6">
          <Link href="/" className="back-button">
            <FiArrowLeft className="text-lg" />
            Back to Events
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 w-full max-w-md flex flex-col gap-5 sm:gap-6 border border-gray-200">
        <div className="text-center mb-3 sm:mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-lg">PNG</span>
          </div>
          <h1 className="page-title text-gray-900 mb-2">
          {modeTitle}
        </h1>
          <p className="page-subtitle text-gray-600">{modeSubtitle}</p>
        </div>

        {hasPendingRedirect && !isForgotPassword && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            You&apos;ll be returned to what you were doing after you sign in.
          </div>
        )}

        {!isForgotPassword && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-sm font-semibold text-gray-900">Create events</p>
              <p className="mt-1 text-xs text-gray-600">Publish listings with dates, pricing, and images.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-sm font-semibold text-gray-900">Manage your profile</p>
              <p className="mt-1 text-xs text-gray-600">Control how attendees can contact you.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-sm font-semibold text-gray-900">Pick up where you left off</p>
              <p className="mt-1 text-xs text-gray-600">Redirects return you to the event or action you started.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 mb-5 sm:mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1">
          <Button
            type="button"
            variant={!isRegister && !isForgotPassword ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchMode('signin')}
            tabIndex={0}
            className="w-full"
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={isRegister ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchMode('register')}
            tabIndex={0}
            className="w-full"
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
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => {
                  if (email && !validateEmail(email)) {
                    setEmailError("Please enter a valid email address");
                  }
                }}
                className="input-field"
                autoFocus={isForgotPassword}
                autoComplete="email"
                inputMode="email"
                required
              />
              {emailError && <p className="form-error mt-2">{emailError}</p>}
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
                autoFocus={isRegister && !isForgotPassword}
                autoComplete="name"
                maxLength={120}
                required
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => {
                  if (email && !validateEmail(email)) {
                    setEmailError("Please enter a valid email address");
                  }
                }}
                className="input-field"
                autoComplete="email"
                inputMode="email"
                required
              />
              {emailError && <p className="form-error mt-2">{emailError}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 touch-target text-gray-500 hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <div className="mt-2" aria-live="polite">
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 1
                          ? 'bg-red-500'
                          : passwordStrength.score <= 2
                            ? 'bg-amber-500'
                            : passwordStrength.score === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(passwordStrength.score, 1) * 25}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${passwordStrength.color}`}>{passwordStrength.label}</p>
                </div>
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Password requirements</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    <p className={password.length >= 8 ? 'text-green-700' : 'text-gray-600'}>At least 8 characters</p>
                    <p className={/(?=.*[a-z])(?=.*[A-Z])/.test(password) ? 'text-green-700' : 'text-gray-600'}>Uppercase and lowercase letters</p>
                    <p className={/\d/.test(password) ? 'text-green-700' : 'text-gray-600'}>At least one number</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    onBlur={() => {
                      if (confirmPassword && password && confirmPassword !== password) {
                        setConfirmPasswordError("Passwords do not match");
                      }
                    }}
                    className="input-field pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 touch-target text-gray-500 hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <p className="form-error mt-2">{confirmPasswordError}</p>}
              </div>

              {/* Contact Preferences */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Preferences (Optional)</h3>
                <p className="text-xs text-gray-500 mb-3">Choose how other users can contact you about your events. This information will be visible to logged-in users.</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
                  <select
                    value={contactMethod}
                    onChange={e => setContactMethod(e.target.value as 'email' | 'phone' | 'both' | 'none')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="both">Email and Phone</option>
                    <option value="email">Email only</option>
                    <option value="phone">Phone only</option>
                    <option value="none">No contact</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Enter your WhatsApp number"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    autoComplete="organization"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">About You (Optional)</label>
                  <textarea
                    placeholder="Tell others about yourself..."
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
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
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => {
                  if (email && !validateEmail(email)) {
                    setEmailError("Please enter a valid email address");
                  }
                }}
                className="input-field"
                autoFocus={!isRegister && !isForgotPassword}
                autoComplete="email"
                inputMode="email"
                required
              />
              {emailError && <p className="form-error mt-2">{emailError}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-12"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 touch-target text-gray-500 hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 self-end font-medium"
                >
                  Forgot Password?
                </button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slide-up-fade border border-gray-100">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-5 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="page-title text-white">Success!</h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="page-subtitle text-gray-700 text-center">{successMessage}</p>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6">
              <Button onClick={handleCloseSuccessModal} className="w-full" size="lg">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
