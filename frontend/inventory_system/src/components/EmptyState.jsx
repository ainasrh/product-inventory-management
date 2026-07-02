export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
