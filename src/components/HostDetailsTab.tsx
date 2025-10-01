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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Host</h2>

      {host ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl p-6 border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300">
          {/* Host Profile Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-md border-4 border-white">
                {host?.photo_url ? (
                  <Image
                    src={host.photo_url}
                    alt={host.name || 'Host'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={32} className="text-gray-500" />
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              {host?.name && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <FiUser size={18} className="text-gray-500" />
                  <span className="font-bold text-xl sm:text-2xl text-gray-900">{host.name}</span>
                </div>
              )}

              {host?.company && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <FiBriefcase size={16} className="text-gray-500" />
                  <span className="text-gray-700 text-base font-medium">{host.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Host Bio */}
          {host?.about && (
            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">About the Host</h3>
              <p className="text-gray-700 text-base leading-relaxed">{host.about}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200/60 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Contact Information</h3>

            {authUser ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {host?.email ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FiMail size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Email</p>
                      <p className="text-blue-700 font-medium text-sm">{host.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FiMail size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 text-sm">Email</p>
                      <p className="text-gray-500 text-sm">Not available</p>
                    </div>
                  </div>
                )}

                {host?.phone ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FiPhone size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 text-sm">Phone</p>
                      <p className="text-green-700 font-medium text-sm">{host.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FiPhone size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 text-sm">Phone</p>
                      <p className="text-gray-500 text-sm">Not available</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-xl">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FiUser size={18} className="text-yellow-600" />
                </div>
                <h4 className="font-semibold text-yellow-900 mb-1 text-base">Sign In Required</h4>
                <p className="text-yellow-800 text-sm">
                  Please <span className="font-bold">log in</span> to your account to view the host's contact information.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/60 text-red-800 px-6 py-8 rounded-2xl text-center shadow-md">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
            <FiUser size={20} className="text-red-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Host Information Unavailable</h3>
          {event?.created_by ? (
            <p className="text-sm">Unable to fetch host details for user ID "{event.created_by}".</p>
          ) : (
            <p className="text-sm">Host details are not available for this event.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HostDetailsTab;
