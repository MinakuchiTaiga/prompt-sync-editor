import { AlertCircle } from 'lucide-react';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorToast = ({ error, onClose }: ErrorToastProps) => {
  if (!error) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center gap-3 max-w-md z-50">
      <AlertCircle size={18} />
      <div className="text-sm font-medium">{error}</div>
      <button onClick={onClose} className="text-red-600 hover:text-red-800 font-bold text-lg leading-none">&times;</button>
    </div>
  );
};
