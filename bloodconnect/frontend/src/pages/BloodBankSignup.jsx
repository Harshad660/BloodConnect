import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import { Heart, Building2, ShieldCheck, Mail, Lock, Phone, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BloodBankSignup = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    licenceNumber: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    lat: '',
    lng: '',
    lowStockThreshold: 5,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if logged in
  if (user) {
    if (user.role === 'bloodbank') return <Navigate to="/bloodbank/dashboard" replace />;
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/requester/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = ({ lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { name, licenceNumber, email, password, phone, address, city, lat, lng, lowStockThreshold } = formData;
    if (!name || !licenceNumber || !email || !password || !phone || !address || !city) {
      setErrorMsg('Please fill in all core fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (lat === '' || lng === '') {
      setErrorMsg('Please select your coordinates on the map.');
      return;
    }

    setLoading(true);

    const payload = {
      name,
      licenceNumber,
      email,
      password,
      phone,
      address,
      city,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
    };

    const res = await signup(payload, true); // true for isBloodBank flag
    setLoading(false);

    if (res.success) {
      toast.success('Blood bank registered successfully! Awaiting admin verification.');
      navigate('/bloodbank/dashboard');
    } else {
      setErrorMsg(res.message);
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-clinical-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-soft-border relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red"></div>

        <div className="flex flex-col items-center text-center">
          <span className="bg-brand-red/10 text-brand-red p-3.5 rounded-2xl mb-4">
            <Building2 className="h-6 w-6 text-brand-red" />
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight text-ink-dark">
            Register Blood Bank
          </h2>
          <p className="mt-2 text-xs text-gray-500 max-w-sm font-medium leading-relaxed">
            Join the BloodConnect emergency network as an organization and manage inventory coordinates.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-sos-red/10 border border-sos-red/25 text-sos-red px-4 py-3.5 rounded-xl text-xxs font-bold flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-sos-red flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-xxs font-black text-gray-400 uppercase tracking-widest border-b border-soft-border pb-2">
                1. Organization Details
              </h3>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Blood Bank Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-450">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Red Cross Blood Center"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Licence / Registration Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-455">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <input
                    name="licenceNumber"
                    type="text"
                    required
                    value={formData.licenceNumber}
                    onChange={handleChange}
                    placeholder="e.g. LIC-998877-BB"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-455">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. contact@bloodbank.org"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-455">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-455">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Location & Threshold Info */}
            <div className="space-y-4">
              <h3 className="text-xxs font-black text-gray-400 uppercase tracking-widest border-b border-soft-border pb-2">
                2. Location & Settings
              </h3>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-455">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 12 Main St, Sector 4"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore"
                    className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Low Stock Alert Limit
                  </label>
                  <input
                    name="lowStockThreshold"
                    type="number"
                    required
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    placeholder="5"
                    className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono font-bold"
                  />
                </div>
              </div>

              {/* Coordinates display read-only */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Click Map"
                    value={formData.lat}
                    className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm bg-clinical-bg/50 text-gray-400 focus:outline-none cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Click Map"
                    value={formData.lng}
                    className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm bg-clinical-bg/50 text-gray-400 focus:outline-none cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Map Picker */}
          <div className="border border-soft-border p-4 rounded-3xl bg-clinical-bg/10">
            <MapPicker onChange={handleLocationChange} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest shadow-xs transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Blood Bank'}
          </button>
        </form>

        <div className="text-center text-xxs font-black text-gray-400 mt-6 space-y-3 uppercase tracking-wider">
          <div>
            <span>Already registered? </span>
            <Link to="/bloodbank/login" className="text-brand-red hover:text-brand-red/90 ml-1">
              Login here
            </Link>
          </div>
          <div className="pt-3 border-t border-soft-border">
            <Link to="/signup" className="text-gray-500 hover:text-brand-red transition duration-150">
              Are you a Donor or Requester? Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankSignup;
