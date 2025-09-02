'use client';
import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function AdminLogin() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already signed in, redirect to admin dashboard
    if (isSignedIn) {
      router.push('/admin');
    }
  }, [isSignedIn, router]);

  // Don't render the sign-in form if user is already signed in
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
            <p className="text-gray-600">Sign in with your email to access the admin panel</p>
          </div>
          
          <SignIn
            path="/admin/login"
            routing="path"
            signUpUrl="/admin/login"
            forceRedirectUrl="/admin"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-black hover:bg-gray-800 text-sm normal-case",
                card: "shadow-md",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "hidden",
                dividerLine: "hidden",
                dividerText: "hidden",
                formFieldLabel: "text-gray-700 font-medium",
                formFieldInput: "border-gray-300 focus:ring-2 focus:ring-gray-200",
              },
            }}
          />
                 </div>
        </div>
    );
  }