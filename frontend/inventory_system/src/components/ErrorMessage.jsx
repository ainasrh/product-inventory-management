export function ErrorMessage({ message }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-red-900/20 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm"
    >
      <span className="text-red-500 text-xl shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
