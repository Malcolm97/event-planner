'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import Link from 'next/link';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null); // New state for photo file
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // New state for photo URL
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    about: '',
    email: '', // Add email to formData
    contactMethod: 'both' as 'email' | 'phone' | 'both' | 'none',
    whatsappNumber: '',
    contactVisibility: true
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      // Only warn if required fields are missing (name and email are required)
      if (!formData.name || !formData.email) {
        event.preventDefault();
        event.returnValue = "You haven't completed your required information. Are you sure you want to leave?";
        return "You haven't completed your required information. Are you sure you want to leave?";
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }
      setUser(user);
      
      // Fetch existing profile data
      const { data } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFormData({
          name: data.name || '',
          company: data.company || '',
          phone: data.phone || '',
          about: data.about || '',
          email: user.email || '', // Set existing email
          contactMethod: data.contact_method || 'both',
          whatsappNumber: data.whatsapp_number || '',
          contactVisibility: data.contact_visibility !== false // Default to true
        });
        setPhotoUrl(data.photo_url || null); // Set existing photo URL
      }
      
      setLoading(false);
    };
    checkUser();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!user) {
        setError('You must be signed in to update your profile');
        return;
      }

      // Check for online-only operations
      if (!isOnline && (photoFile || formData.email !== user.email)) {
        setError('Photo uploads and email changes require an internet connection. Please try again when online.');
        setSubmitting(false);
        return;
      }

      let newPhotoUrl: string | null = photoUrl;
      if (photoFile && isOnline) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `user-photos/${fileName}`; // Store in a 'user-photos' bucket

        const { error: uploadError } = await supabase.storage
          .from('user-photos') // Ensure you have a bucket named 'user-photos'
          .upload(filePath, photoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          setError(`Error uploading photo: ${uploadError.message}`);
          setSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('user-photos')
          .getPublicUrl(filePath);

        newPhotoUrl = publicUrlData.publicUrl;
      }

      const updateData = {
        id: user.id,
        email: formData.email,
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        about: formData.about,
        photo_url: newPhotoUrl, // Update photo URL
        contact_method: formData.contactMethod,
        whatsapp_number: formData.whatsappNumber || null,
        contact_visibility: formData.contactVisibility,
        updated_at: new Date().toISOString(),
      };

      // Update user email if it has changed (online only)
      if (formData.email !== user.email && isOnline) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: formData.email
        });
        if (emailUpdateError) {
          throw emailUpdateError;
        }
      }

      // Use queueOperation for database update (works online and offline)
      await queueOperation('update', TABLES.USERS, updateData);

      setSuccess('Profile updated successfully!');
      setPhotoUrl(newPhotoUrl); // Update state with new photo URL
      
      // Wait a moment for the success message to be seen, then refresh and navigate
      setTimeout(async () => {
        // Refresh the router to ensure fresh server data
        router.refresh();
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!user) {
        setError('You must be signed in to update your password');
        return;
      }

      // Validate password fields
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setError('Please fill in all password fields');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New password and confirmation password do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      // Note: Password verification is not possible via client-side signInWithPassword
      // without signing out the user. Supabase handles verification server-side.
      // Update the password directly - Supabase will verify the current password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        // Check if error is related to password verification
        if (updateError.message?.includes('current password') || updateError.message?.includes('verify')) {
          setError('Current password verification failed. Please try again.');
        } else {
          throw updateError;
        }
        return;
      }

      setSuccess('Password updated successfully!');
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-yellow-400 bg-white bg-opacity-90 px-3 py-2 rounded-lg transition-colors"
          >
            <FiArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 mt-4 border border-gray-200">
          <div className="text-center mb-6">
            {photoUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                <Image src={photoUrl} alt="Profile Photo" width={80} height={80} className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-2">Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              />
            </div>

            <div className="flex flex-wrap -mx-2">
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
                {formData.email !== user.email && (
                  <p className="text-sm text-amber-600 mt-2">⚠️ Changing your email requires verification. Check your new email for a confirmation link.</p>
                )}
              </div>

              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                About
              </label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Contact Preferences */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Preferences</h3>
              <p className="text-sm text-gray-600 mb-4">Choose how other users can contact you about your events. This information will be visible to logged-in users only.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    id="contactMethod"
                    name="contactMethod"
                    value={formData.contactMethod}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="both">Email and Phone</option>
                    <option value="email">Email only</option>
                    <option value="phone">Phone only</option>
                    <option value="none">No contact</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Enter your WhatsApp number"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contactVisibility"
                  name="contactVisibility"
                  checked={formData.contactVisibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactVisibility: e.target.checked }))}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="contactVisibility" className="ml-2 block text-sm text-gray-700">
                  Allow other logged-in users to see my contact information on my profile
                </label>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap -mx-2">
                  <div className="w-full md:w-1/2 px-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2 px-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={submitting}
                  className="w-full rounded-lg px-6 py-3 bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
