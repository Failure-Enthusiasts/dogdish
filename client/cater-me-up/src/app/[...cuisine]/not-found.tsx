import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Menu Not Found</h2>
        <p className="text-gray-600 mb-8">
          The menu you are looking for does not exist or might have been removed.
        </p>
        <Link 
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 