'use client';
import Head from 'next/head';
import { useRouter } from 'next/navigation'; // Keep for potential redirects
import { useEffect } from 'react';


export default function AdminLogin() {
  const router = useRouter();
  // This page will likely be replaced or heavily modified by Clerk.
  // For now, it can redirect to the main admin page, assuming Clerk will protect it,
  // or redirect to Clerk's sign-in page once that's set up.
  // Or simply show a message.

  // useEffect(() => {
  //   // Example: Redirect to where Clerk's sign-in might be, or let middleware handle it.
  //   // router.push('/sign-in');
  // }, [router]);

  return (
    <>
      <Head>
        <title>Admin Login | Cater Me Up</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold mb-2">Admin Section</h1>
          <p className="text-gray-600">Authentication will be handled by Clerk.</p>
          {/* Optionally, redirect or link to where the Clerk sign-in will be:
          <button onClick={() => router.push('/sign-in')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Proceed to Sign In (Placeholder)
          </button>
          */}
        </div>
      </div>
    </>
  );
}