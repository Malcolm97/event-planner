export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
        <p className="text-gray-500 mt-6 text-lg">Loading...</p>
      </div>
    </div>
  );
}
