'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs"; // For userId if needed, and for checking isSignedIn

// Icons
import { UploadCloud, FileText, XCircle, CheckCircle } from 'lucide-react';

export default function UploadPdfPage() {
  const { isLoaded, isSignedIn, userId } = useAuth(); // Clerk's hook

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // uploadProgress state and related logic removed for simplicity with fetch
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadError(null);
        setUploadSuccess(null);
      } else {
        setSelectedFile(null);
        setUploadError('Invalid file type. Please select a PDF file.');
        setUploadSuccess(null);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a PDF file to upload.');
      return;
    }

    if (!isSignedIn) {
      setUploadError('You must be signed in to upload a menu.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await fetch('/api/upload-menu', {
        method: 'POST',
        body: formData,
        // Headers are not typically needed for FormData with fetch, browser sets Content-Type
        // Clerk authentication is handled by middleware and cookies automatically.
      });

      const result = await response.json(); // Try to parse JSON regardless of response.ok

      if (response.ok) {
        setUploadSuccess(result.message || 'PDF uploaded and processed successfully!');
        // Optionally clear the selected file:
        // setSelectedFile(null);
      } else {
        setUploadError(result.error || result.details || `Server error: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(`Upload failed: ${error.message || 'Network error or server unreachable.'}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex justify-center items-center min-h-screen">Authenticating...</div>;
  }

  if (isLoaded && !isSignedIn) {
      return (
          <div className="flex flex-col justify-center items-center min-h-screen">
              <p className="mb-4">You need to be signed in to access this page.</p>
              <Link href="/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Sign In
              </Link>
          </div>
      );
  }

  return (
    <>
      <Head>
        <title>Upload PDF | Admin Panel</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Upload PDF Menu</h1>
            <div>
              <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
                &larr; Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Upload New PDF Menu</h2>
              <p className="text-sm text-gray-600">Select a PDF file to upload. This will be processed and stored.</p>
            </div>

            <div className="mb-6">
              <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Choose PDF file
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="pdf-upload-input"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="pdf-upload-input"
                        name="pdf-upload"
                        type="file"
                        className="sr-only"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB (example limit)</p>
                </div>
              </div>
            </div>

            {selectedFile && !uploadSuccess && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Selected file: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading || !isSignedIn} // Disable if not signed in
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Upload PDF'}
              </button>
            </div>

            {/* Progress bar removed for simplicity with fetch */}

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm">{uploadSuccess}</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
