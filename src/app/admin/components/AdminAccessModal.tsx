import React from 'react';
import Button from '@/components/Button';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const AdminAccessModal: React.FC<AdminAccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">PNG</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-600 text-lg">You need administrator privileges to access this area</p>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm font-medium text-center">
            This area is restricted to administrators only. Please contact your system administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" fullWidth>
            <Link href="/" className="flex items-center justify-center gap-2">
              <FiArrowLeft className="text-lg" />
              Back to Events
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessModal;
