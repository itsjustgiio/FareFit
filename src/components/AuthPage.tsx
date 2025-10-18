import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import logoImage from 'figma:asset/77bf03e5d71328d3253fb9c4f7bef47edf94924a.png';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.ts";
import { createUserRecords } from "../userService.ts";

interface AuthPageProps {
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, password: string, name: string) => void;
  onBack: () => void;
  onGoogleLogin?: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthPage({ onLogin, onSignup, onBack, onGoogleLogin, initialMode = 'login' }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && !name) {
      setError('Please enter your name');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isLogin) {
      onLogin(email, password);
    } else {
      onSignup(email, password, name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'white' }}>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-8 shadow-xl"
          style={{ backgroundColor: '#E8F4F2' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <img 
              src={logoImage} 
              alt="FareFit Logo" 
              className="w-32 h-32 object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl mb-2" style={{ color: '#102A43' }}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ color: '#102A43', opacity: 0.6 }}>
              {isLogin
                ? 'Sign in to continue your fitness journey'
                : 'Start your personalized fitness journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm mb-2" style={{ color: '#102A43' }}>
                  Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: '#102A43', opacity: 0.4 }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                    style={{
                      borderColor: '#A8E6CF',
                      color: '#102A43',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1C7C54')}
                    onBlur={(e) => (e.target.style.borderColor = '#A8E6CF')}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2" style={{ color: '#102A43' }}>
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#102A43', opacity: 0.4 }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={{
                    borderColor: '#A8E6CF',
                    color: '#102A43',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1C7C54')}
                  onBlur={(e) => (e.target.style.borderColor = '#A8E6CF')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#102A43' }}>
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#102A43', opacity: 0.4 }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={{
                    borderColor: '#A8E6CF',
                    color: '#102A43',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1C7C54')}
                  onBlur={(e) => (e.target.style.borderColor = '#A8E6CF')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#102A43', opacity: 0.4 }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm mb-2" style={{ color: '#102A43' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: '#102A43', opacity: 0.4 }}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all focus:outline-none"
                    style={{
                      borderColor: '#A8E6CF',
                      color: '#102A43',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1C7C54')}
                    onBlur={(e) => (e.target.style.borderColor = '#A8E6CF')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: '#102A43', opacity: 0.4 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ backgroundColor: '#FFB6B9', color: '#102A43' }}
              >
                {error}
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: '#1C7C54' }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              style={{ backgroundColor: '#1C7C54' }}
            >
              {isLogin ? 'Log In' : 'Continue'}
            </button>
          </form>

          {/* Social Login (Login page only) */}
          {isLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#A8E6CF' }} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white" style={{ color: '#102A43', opacity: 0.6 }}>
                    or continue with
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="flex-1 py-3 px-4 rounded-xl border-2 transition-all hover:shadow-md flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#102A43' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  className="flex-1 py-3 px-4 rounded-xl border-2 transition-all hover:shadow-md flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#102A43' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}

          {/* Toggle */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm hover:underline"
              style={{ color: '#1C7C54' }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log In'}
            </button>
          </div>

          {/* Back to Landing */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm hover:underline"
              style={{ color: '#102A43', opacity: 0.6 }}
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
