import { cn } from '@utils/cn';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'parsing' | 'uploading' | 'completed' | 'error';
  message?: string;
}

export const UploadProgress = ({ progress, status, message }: UploadProgressProps) => {
  if (status === 'idle') return null;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{status}</span>
        <span className="text-sm">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            status === 'error' ? 'bg-red-500' : 'bg-blue-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && <p className="text-sm text-red-500 mt-1">{message}</p>}
    </div>
  );
};
