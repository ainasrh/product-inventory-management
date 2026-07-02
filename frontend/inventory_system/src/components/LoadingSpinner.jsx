export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
