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
      setErrorMsg('Please select your coordinates on the map or tap "Detect My Location".');
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-100 relative">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-800 rounded-t-3xl"></div>

        <div className="flex flex-col items-center text-center">
          <span className="bg-red-100 text-red-600 p-3 rounded-2xl shadow-sm mb-4">
            <Building2 className="h-8 w-8 text-red-600 animate-pulse" />
          </span>
          <h2 className="text-3xl font-black font-display tracking-tight text-gray-900">
            Register Blood Bank
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Join the BloodConnect emergency network as an organization and manage your stock levels.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                1. Organization Details
              </h3>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Blood Bank Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Red Cross Blood Center"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Licence / Registration Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <input
                    name="licenceNumber"
                    type="text"
                    required
                    value={formData.licenceNumber}
                    onChange={handleChange}
                    placeholder="e.g. LIC-998877-BB"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. contact@bloodbank.org"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
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
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Location & Threshold Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                2. Location & Settings
              </h3>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 12 Main St, Sector 4"
                    className="block w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
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
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
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
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
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
                    className="block w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
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
                    className="block w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Map Picker */}
          <div className="border border-gray-100 p-4 rounded-3xl bg-gray-50/50">
            <MapPicker onChange={handleLocationChange} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Blood Bank'}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-gray-500 mt-6">
          <span>Already registered? </span>
          <Link to="/bloodbank/login" className="text-red-600 hover:text-red-700 hover:underline ml-1">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BloodBankSignup;
