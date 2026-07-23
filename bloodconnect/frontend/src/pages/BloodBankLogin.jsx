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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-clinical-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-soft-border relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red"></div>

        <div className="flex flex-col items-center text-center">
          <span className="bg-brand-red/10 text-brand-red p-3.5 rounded-2xl mb-4">
            <Building2 className="h-6 w-6 text-brand-red" />
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight text-ink-dark">
            Blood Bank Portal
          </h2>
          <p className="mt-2 text-xs text-gray-500 max-w-sm font-medium leading-relaxed">
            Sign in with your organization credentials to manage live inventory levels and respond to urgent hospital SOS matching broadcasts.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-sos-red/10 border border-sos-red/25 text-sos-red px-4 py-3.5 rounded-xl text-xxs font-bold flex items-start space-x-2 animate-enter">
            <AlertCircle className="h-4 w-4 text-sos-red flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-555 uppercase tracking-wider mb-1.5">
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
                  className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-555 uppercase tracking-wider mb-1.5">
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
                  className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest shadow-xs transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xxs font-black text-gray-400 mt-6 space-y-3 uppercase tracking-wider">
          <div>
            <span>Need to register your blood bank? </span>
            <Link to="/bloodbank/signup" className="text-brand-red hover:text-brand-red/90 ml-1">
              Sign up here
            </Link>
          </div>
          <div className="pt-3 border-t border-soft-border">
            <Link to="/login" className="text-gray-500 hover:text-brand-red transition duration-150">
              Are you a Donor or Requester? Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankLogin;
