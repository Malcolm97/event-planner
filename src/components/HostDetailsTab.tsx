import React from 'react';
import { FiUser, FiBriefcase, FiMail, FiPhone, FiExternalLink, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Image from 'next/image';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { storeSigninRedirect } from '@/lib/utils';
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
    <div className="space-y-4 sm:space-y-5">
      {host ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl p-4 sm:p-5 border border-gray-200/60 shadow-sm">
          {/* Host Profile Section */}
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5">
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
                <span className="modal-subtitle font-semibold text-gray-900 truncate block">{host.name}</span>
              )}

              {host?.company && (
                <span className="modal-body-copy text-gray-600 truncate block">{host.company}</span>
              )}
            </div>
          </div>

          {/* Host Bio */}
          {host?.about && (
            <div className="mb-5">
              <p className="modal-body-copy text-gray-700 leading-7">{host.about}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 sm:p-4 rounded-2xl border border-gray-200/60">
            {authUser ? (
              host?.contact_visibility ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(host.contact_method === 'email' || host.contact_method === 'both') && host.email && (
                    <a
                      href={`mailto:${host.email}`}
                      className="flex items-center gap-3 min-h-[48px] p-3 rounded-xl bg-blue-50 border border-blue-200/60 hover:bg-blue-100/70 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FiMail size={14} className="text-blue-600" />
                      </div>
                      <span className="text-blue-700 text-sm font-medium truncate">{host.email}</span>
                    </a>
                  )}

                  {(host.contact_method === 'phone' || host.contact_method === 'both') && host.phone && (
                    <a
                      href={`tel:${host.phone}`}
                      className="flex items-center gap-3 min-h-[48px] p-3 rounded-xl bg-green-50 border border-green-200/60 hover:bg-green-100/70 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FiPhone size={14} className="text-green-600" />
                      </div>
                      <span className="text-green-700 text-sm font-medium truncate">{host.phone}</span>
                    </a>
                  )}

                  {host.whatsapp_number && (
                    <a
                      href={getWhatsAppUrl(host.whatsapp_number, getEventInquiryMessage(event.name || 'your event'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-h-[48px] p-3 rounded-xl bg-green-50 border border-green-200/60 hover:bg-green-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FaWhatsapp size={14} className="text-green-600" />
                      </div>
                      <span className="text-green-700 text-sm font-medium truncate">WhatsApp</span>
                    </a>
                  )}

                  {(!host.contact_method || host.contact_method === 'none') && !host.whatsapp_number && (
                    <div className="col-span-full text-center py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-gray-500 text-sm">Host prefers not to be contacted</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 px-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm">Contact information private</p>
                </div>
              )
            ) : (
              <div className="text-center py-4 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-xl">
                <p className="text-yellow-800 text-sm leading-6 mb-3">
                  <span className="font-semibold">Sign in</span> to view contact info
                </p>
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors text-sm font-medium"
                >
                  Sign In
                  <FiExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200/60 text-orange-800 px-4 py-6 rounded-2xl text-center">
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
            <FiUser size={18} className="text-orange-600" />
          </div>
          <h3 className="modal-section-title mb-1.5">Host Unavailable</h3>
          <p className="modal-body-copy">
            {!isOnline ? 'Offline mode' : event?.created_by ? 'Unable to fetch' : 'Not available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default HostDetailsTab;
