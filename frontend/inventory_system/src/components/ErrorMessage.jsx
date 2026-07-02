export function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
      <span className="font-medium">Error: </span>{message}
    </div>
  );
}
