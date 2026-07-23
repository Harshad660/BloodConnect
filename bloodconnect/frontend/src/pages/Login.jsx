import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If user is already logged in, redirect them
  if (user) {
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/requester/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Welcome back to BloodConnect!');
      if (res.role === 'donor') {
        navigate('/donor/dashboard');
      } else if (res.role === 'admin') {
        navigate('/admin');
      } else if (res.role === 'bloodbank') {
        navigate('/bloodbank/dashboard');
      } else {
        navigate('/requester/dashboard');
      }
    } else {
      setErrorMsg(res.message);
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-clinical-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-soft-border relative overflow-hidden">
        {/* Top visual accents */}
        <div className="absolute top-0 inset-x-0 h-1 bg-sos-red"></div>

        <div className="flex flex-col items-center">
          <span className="bg-sos-red/10 text-sos-red p-3.5 rounded-2xl mb-4 relative flex h-12 w-12 items-center justify-center">
            <Heart className="h-6 w-6 text-sos-red fill-current animate-pulse-slow" />
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight text-ink-dark">
            Account Sign In
          </h2>
          <p className="mt-2 text-xs text-gray-500 text-center font-medium leading-relaxed">
            Access your donor metrics registry, check active spatial SOS matching alerts, or find community blood banks near you.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-sos-red/10 border border-sos-red/25 text-sos-red px-4 py-3 rounded-xl text-xxs font-bold flex items-start space-x-2 animate-enter">
            <AlertCircle className="h-4 w-4 text-sos-red flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 transition duration-150"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 transition duration-150"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-xs font-black rounded-xl text-white bg-ink-dark hover:bg-ink-dark/95 shadow-sm focus:outline-none transition duration-150 disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 space-y-3">
          <p className="text-xs text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="font-extrabold text-brand-red hover:text-brand-red/90 transition duration-150">
              Create Account
            </Link>
          </p>
          <div className="pt-3 border-t border-soft-border">
            <Link to="/bloodbank/login" className="text-xxs font-black text-gray-400 hover:text-brand-red uppercase tracking-wider transition duration-150">
              Go to Blood Bank Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
