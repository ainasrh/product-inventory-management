export function EmptyState({ message, actionLabel, onAction, icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-800">
      <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-2xl">
        {icon || '📦'}
      </div>
      <p className="text-gray-400 text-sm max-w-xs">{message}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
