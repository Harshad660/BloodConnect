import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BloodBankLogin = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if logged in
  if (user) {
    if (user.role === 'bloodbank') return <Navigate to="/bloodbank/dashboard" replace />;
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/requester/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const res = await login(email, password, true); // true for isBloodBank flag
    setLoading(false);

    if (res.success) {
      toast.success('Successfully logged in!');
      navigate('/bloodbank/dashboard');
    } else {
      setErrorMsg(res.message);
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-100 relative">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-800 rounded-t-3xl"></div>

        <div className="flex flex-col items-center text-center">
          <span className="bg-red-100 text-red-600 p-3 rounded-2xl shadow-sm mb-4">
            <Building2 className="h-8 w-8 text-red-600 animate-pulse" />
          </span>
          <h2 className="text-3xl font-black font-display tracking-tight text-gray-900">
            Blood Bank Portal
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Sign in with your organization credentials to manage inventory and respond to SOS requests.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-enter">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Organization Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@bloodbank.org"
                  className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-gray-500 mt-6 space-y-2">
          <div>
            <span>Need to register your organization? </span>
            <Link to="/bloodbank/signup" className="text-red-600 hover:text-red-700 hover:underline ml-1">
              Sign up here
            </Link>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <Link to="/login" className="text-gray-500 hover:text-red-600 transition duration-150">
              Are you a Donor or Requester? Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankLogin;
