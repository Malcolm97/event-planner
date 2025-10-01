import React from 'react';
import { FiUser, FiBriefcase, FiMail, FiPhone } from 'react-icons/fi';
import Image from 'next/image';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';

interface HostDetailsTabProps {
  event: EventItem;
  host: User | null;
}

const HostDetailsTab: React.FC<HostDetailsTabProps> = ({ event, host }) => {
  const { user: authUser } = useAuth();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Event Host</h2>

      {host ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl p-8 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Host Profile Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                {host?.photo_url ? (
                  <Image
                    src={host.photo_url}
                    alt={host.name || 'Host'}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={40} className="text-gray-500" />
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              {host?.name && (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <FiUser size={20} className="text-gray-500" />
                  <span className="font-bold text-2xl sm:text-3xl text-gray-900">{host.name}</span>
                </div>
              )}

              {host?.company && (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <FiBriefcase size={18} className="text-gray-500" />
                  <span className="text-gray-700 text-lg font-medium">{host.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Host Bio */}
          {host?.about && (
            <div className="mb-8">
              <h3 className="font-bold text-xl text-gray-900 mb-3">About the Host</h3>
              <p className="text-gray-700 text-lg leading-relaxed">{host.about}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Contact Information</h3>

            {authUser ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {host?.email ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FiMail size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">Email</p>
                      <p className="text-blue-700 font-medium">{host.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FiMail size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Email</p>
                      <p className="text-gray-500">Not available</p>
                    </div>
                  </div>
                )}

                {host?.phone ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <FiPhone size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Phone</p>
                      <p className="text-green-700 font-medium">{host.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FiPhone size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Phone</p>
                      <p className="text-gray-500">Not available</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 px-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-2xl">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <FiUser size={20} className="text-yellow-600" />
                </div>
                <h4 className="font-semibold text-yellow-900 mb-2">Sign In Required</h4>
                <p className="text-yellow-800 text-lg">
                  Please <span className="font-bold">log in</span> to your account to view the host's contact information.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/60 text-red-800 px-8 py-12 rounded-3xl text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center shadow-md">
            <FiUser size={24} className="text-red-600" />
          </div>
          <h3 className="font-semibold text-xl mb-2">Host Information Unavailable</h3>
          {event?.created_by ? (
            <p className="text-lg">Unable to fetch host details for user ID "{event.created_by}".</p>
          ) : (
            <p className="text-lg">Host details are not available for this event.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HostDetailsTab;
