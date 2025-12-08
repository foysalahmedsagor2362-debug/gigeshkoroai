import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Logo } from '../UIComponents';
import { login, register } from '../../services/backend';
import { User } from '../../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      let user;
      if (isRegister) {
        user = await register(email, password);
      } else {
        user = await login(email, password);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      {/* Back Button */}
      {onBack && (
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
            <ArrowLeft size={20} />
            Back to Home
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <Logo size={80} className="shadow-xl shadow-primary-200 rounded-2xl mb-6" />
          <h1 className="text-2xl font-bold text-slate-800">JIGESH AI Tutor</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRegister ? 'Create your student account' : 'Sign in to continue learning'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            className="w-full h-11 mt-2 text-base" 
            isLoading={isLoading}
            icon={!isLoading && <ArrowRight size={18} />}
          >
            {isRegister ? 'Create Account' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="ml-2 text-primary-600 font-bold hover:underline"
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};