import React from 'react';
import { FiUser, FiBriefcase, FiMail, FiPhone, FiExternalLink, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Image from 'next/image';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { storeSigninRedirect, ModalState } from '@/lib/utils';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { getWhatsAppUrl, getEventInquiryMessage } from '@/lib/thirdPartyUtils';

interface HostDetailsTabProps {
  event: EventItem;
  host: User | null;
}

const HostDetailsTab: React.FC<HostDetailsTabProps> = ({ event, host }) => {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const handleSignInClick = () => {
    // Store current URL and modal state for redirect after sign-in
    const currentUrl = window.location.pathname + window.location.search;
    storeSigninRedirect(currentUrl, {
      type: 'event-modal',
      eventId: event.id,
      activeTab: 'host-details'
    });
    router.push('/signin');
  };

  return (
    <div className="space-y-3">
      {host ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-xl p-4 border border-gray-200/60 shadow-sm">
          {/* Host Profile Section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
                {host?.photo_url ? (
                  <Image
                    src={host.photo_url}
                    alt={host.name || 'Host'}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={20} className="text-gray-500" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {host?.name && (
                <span className="font-semibold text-sm sm:text-base text-gray-900 truncate block">{host.name}</span>
              )}

              {host?.company && (
                <span className="text-gray-600 text-xs sm:text-sm truncate block">{host.company}</span>
              )}
            </div>
          </div>

          {/* Host Bio */}
          {host?.about && (
            <div className="mb-4">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{host.about}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border border-gray-200/60">
            {authUser ? (
              host?.contact_visibility ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(host.contact_method === 'email' || host.contact_method === 'both') && host.email && (
                    <a
                      href={`mailto:${host.email}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200/60"
                    >
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                        <FiMail size={12} className="text-blue-600" />
                      </div>
                      <span className="text-blue-700 text-xs truncate">{host.email}</span>
                    </a>
                  )}

                  {(host.contact_method === 'phone' || host.contact_method === 'both') && host.phone && (
                    <a
                      href={`tel:${host.phone}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200/60"
                    >
                      <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                        <FiPhone size={12} className="text-green-600" />
                      </div>
                      <span className="text-green-700 text-xs truncate">{host.phone}</span>
                    </a>
                  )}

                  {host.whatsapp_number && (
                    <a
                      href={getWhatsAppUrl(host.whatsapp_number, getEventInquiryMessage(event.name || 'your event'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200/60 hover:bg-green-100 transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                        <FaWhatsapp size={14} className="text-green-600" />
                      </div>
                      <span className="text-green-700 text-xs truncate">WhatsApp</span>
                    </a>
                  )}

                  {(!host.contact_method || host.contact_method === 'none') && !host.whatsapp_number && (
                    <div className="col-span-full text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-500 text-xs">Host prefers not to be contacted</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-xs">Contact information private</p>
                </div>
              )
            ) : (
              <div className="text-center py-3 px-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-lg">
                <p className="text-yellow-800 text-xs mb-2">
                  <span className="font-semibold">Sign in</span> to view contact info
                </p>
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-xs font-medium"
                >
                  Sign In
                  <FiExternalLink size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200/60 text-orange-800 px-4 py-5 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-orange-100 flex items-center justify-center">
            <FiUser size={18} className="text-orange-600" />
          </div>
          <h3 className="font-medium text-sm mb-1">Host Unavailable</h3>
          <p className="text-xs">
            {!isOnline ? 'Offline mode' : event?.created_by ? 'Unable to fetch' : 'Not available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default HostDetailsTab;
