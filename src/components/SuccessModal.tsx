import React from 'react';
import Button from './Button';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Success!</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            size="sm"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
