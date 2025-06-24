'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    
    try {
      // Client-side validation
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      
      // Basic validation
      if (!trimmedUsername || !trimmedPassword) {
        setError('Please enter both username and password');
        return;
      }
      
      // Username validation
      if (trimmedUsername.length < 1 || trimmedUsername.length > 50) {
        setError('Username must be between 1 and 50 characters');
        return;
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        setError('Username can only contain letters, numbers, hyphens, and underscores');
        return;
      }
      
      // Password validation
      if (trimmedPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      
      if (trimmedPassword.length > 128) {
        setError('Password is too long');
        return;
      }
      
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmedPassword)) {
        setError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
        return;
      }
      
      // Sanitize inputs (escape HTML entities)
      const sanitizedUsername = trimmedUsername
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      
      // Rate limiting check (simple client-side protection)
      const lastAttemptTime = localStorage.getItem('lastLoginAttempt');
      const attemptCount = parseInt(localStorage.getItem('loginAttempts') || '0');
      const now = Date.now();
      
      if (lastAttemptTime && attemptCount >= 5) {
        const timeDiff = now - parseInt(lastAttemptTime);
        if (timeDiff < 15 * 60 * 1000) { // 15 minutes cooldown
          const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / 60000);
          setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
          return;
        } else {
          // Reset attempts after cooldown
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('lastLoginAttempt');
        }
      }
      
      // In a real application, you would validate credentials against your backend
      // For demo purposes, we'll use a hardcoded check
      if (sanitizedUsername === 'admin' && trimmedPassword === 'Password123') {
        // Reset failed attempts on successful login
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
        
        // Set a cookie or token to maintain the session
        // For example:
        // document.cookie = 'isAuthenticated=true; path=/; max-age=3600';
        
        // Store in localStorage (not secure for production, just for demo)
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', now.toString());
        
        // Redirect to the admin dashboard
        router.push('/admin');
      } else {
        // Track failed attempts
        const newAttemptCount = attemptCount + 1;
        localStorage.setItem('loginAttempts', newAttemptCount.toString());
        localStorage.setItem('lastLoginAttempt', now.toString());
        
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login | Olive & Basil</title>
      </Head>
      
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
            <p className="text-gray-600">Enter your credentials to access the admin panel</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-gray-800 font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>
            
            <div className="mb-8">
              <label htmlFor="password" className="block text-gray-800 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}