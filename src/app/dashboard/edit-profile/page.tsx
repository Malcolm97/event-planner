'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, recordActivity, USER_FIELDS } from '@/lib/supabase';
import { normalizeUser, prepareUserForDb } from '@/lib/types';
import Link from 'next/link';
import { FiArrowLeft, FiCamera, FiX, FiRefreshCw, FiUser, FiCheck } from 'react-icons/fi';
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    about: '',
    email: '', // Add email to formData
    contactMethod: 'both' as 'email' | 'phone' | 'both' | 'none',
    whatsappNumber: '',
    contactVisibility: true,
    // Social links
    socialLinks: {
      facebook: '',
      instagram: '',
      tiktok: '',
      twitter: ''
    },
    showSocialLinks: true
  });
  const router = useRouter();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  // Handle photo file selection with preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Cleanup previous preview
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
      
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      previewRef.current = preview;
      setPhotoPreview(preview);
      setError('');
    }
  };

  // Cancel photo selection
  const handleCancelPhoto = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        // Normalize user data to handle field name variants (full_name/name, avatar_url/photo_url)
        const normalizedData = normalizeUser(data);
        setFormData({
          name: normalizedData.name || normalizedData.full_name || '',
          company: normalizedData.company || '',
          phone: normalizedData.phone || '',
          about: normalizedData.about || '',
          email: user.email || '', // Set existing email
          contactMethod: normalizedData.contact_method || 'both',
          whatsappNumber: normalizedData.whatsapp_number || '',
          contactVisibility: normalizedData.contact_visibility !== false, // Default to true
          // Social links
          socialLinks: {
            facebook: normalizedData.social_links?.facebook || '',
            instagram: normalizedData.social_links?.instagram || '',
            tiktok: normalizedData.social_links?.tiktok || '',
            twitter: normalizedData.social_links?.twitter || ''
          },
          showSocialLinks: normalizedData.show_social_links !== false // Default to true
        });
        setPhotoUrl(normalizedData.photo_url || normalizedData.avatar_url || null); // Set existing photo URL
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

      // Build social links object (only include non-empty values)
      const socialLinks: Record<string, string> = {};
      if (formData.socialLinks.facebook?.trim()) {
        socialLinks.facebook = formData.socialLinks.facebook.trim();
      }
      if (formData.socialLinks.instagram?.trim()) {
        socialLinks.instagram = formData.socialLinks.instagram.trim();
      }
      if (formData.socialLinks.tiktok?.trim()) {
        socialLinks.tiktok = formData.socialLinks.tiktok.trim();
      }
      if (formData.socialLinks.twitter?.trim()) {
        socialLinks.twitter = formData.socialLinks.twitter.trim();
      }

      // Prepare data with correct database column names (full_name instead of name, avatar_url instead of photo_url)
      const updateData = {
        id: user.id,
        email: formData.email,
        full_name: formData.name, // Database uses 'full_name' column
        company: formData.company,
        phone: formData.phone,
        about: formData.about,
        avatar_url: newPhotoUrl, // Database uses 'avatar_url' column
        contact_method: formData.contactMethod,
        whatsapp_number: formData.whatsappNumber || null,
        contact_visibility: formData.contactVisibility,
        social_links: socialLinks,
        show_social_links: formData.showSocialLinks,
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

      // Update profile in database
      if (isOnline) {
        // Direct Supabase call when online for better error handling
        const { error: updateError } = await supabase
          .from(TABLES.USERS)
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update profile in database');
        }
      } else {
        // Queue for offline sync
        await queueOperation('update', TABLES.USERS, updateData);
      }

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
            <h1 className="text-base sm:text-base lg:text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-2">Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Profile Photo
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Current/Existing Photo */}
                <div className="flex flex-col items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mb-2">
                    Current
                  </span>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 ring-2 ring-gray-300">
                      {photoUrl && !imageError ? (
                        <>
                          {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-yellow-500" />
                            </div>
                          )}
                          <Image 
                            src={photoUrl} 
                            alt="Current Profile Photo" 
                            width={96} 
                            height={96} 
                            className={`object-cover w-full h-full transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                              setImageLoading(false);
                              setImageError(true);
                            }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-3xl font-bold">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    {/* Camera icon overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-yellow-500 text-white rounded-full p-2 shadow-lg hover:bg-yellow-600 transition-colors"
                      title="Change photo"
                    >
                      <FiCamera size={16} />
                    </button>
                  </div>
                  {imageError && photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <FiRefreshCw size={12} />
                      Failed to load - click to retry
                    </button>
                  )}
                </div>

                {/* Arrow for desktop */}
                {photoPreview && (
                  <div className="hidden sm:block text-gray-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                {/* New Photo Preview */}
                {photoPreview && (
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-2">
                      New
                    </span>
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-green-400 ring-offset-2">
                        <img
                          src={photoPreview}
                          alt="New Profile Photo Preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelPhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                        title="Cancel new photo"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Will replace current photo</p>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {/* Upload button */}
              {!photoPreview && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiCamera size={16} />
                    {photoUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                JPG, PNG, GIF, or WebP • Max 5MB
              </p>
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

            {/* Social Links */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
              <p className="text-sm text-gray-600 mb-4">Add your social media profiles. These will be displayed on your public creator profile.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C23.027 19.612 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </span>
                  </label>
                  <input
                    type="url"
                    id="facebook"
                    name="facebook"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                    }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="https://facebook.com/yourprofile"
                  />
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-500">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </span>
                  </label>
                  <input
                    type="url"
                    id="instagram"
                    name="instagram"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>

                <div>
                  <label htmlFor="tiktok" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok
                    </span>
                  </label>
                  <input
                    type="url"
                    id="tiktok"
                    name="tiktok"
                    value={formData.socialLinks.tiktok}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                    }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="https://tiktok.com/@yourprofile"
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-900">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter / X
                    </span>
                  </label>
                  <input
                    type="url"
                    id="twitter"
                    name="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="https://x.com/yourprofile"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showSocialLinks"
                  name="showSocialLinks"
                  checked={formData.showSocialLinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, showSocialLinks: e.target.checked }))}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="showSocialLinks" className="ml-2 block text-sm text-gray-700">
                  Display social links on my public profile
                </label>
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

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
