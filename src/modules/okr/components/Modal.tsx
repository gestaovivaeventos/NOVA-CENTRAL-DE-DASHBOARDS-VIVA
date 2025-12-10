import React from 'react';
import { X } from 'lucide-react';
import { helpTexts } from '../config/app.config';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-secondary rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-dark-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-tertiary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  helpKey: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, helpKey }) => {
  const helpContent = helpTexts[helpKey] || helpTexts['PADRÃO'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={helpContent.title}>
      <div
        className="text-text-secondary space-y-3 [&_p]:leading-relaxed [&_strong]:text-text-primary"
        dangerouslySetInnerHTML={{ __html: helpContent.body }}
      />
    </Modal>
  );
};

export default Modal;
