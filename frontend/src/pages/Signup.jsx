import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import { Heart, User, Mail, Lock, Phone, MapPin, Calendar, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Signup = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'requester', // default
    bloodGroup: '',
    city: '',
    pincode: '',
    lat: '',
    lng: '',
    lastDonationDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If user is already logged in, redirect them
  if (user) {
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

  const handleRoleChange = (selectedRole) => {
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      // Clear donor fields if shifting back to requester
      bloodGroup: selectedRole === 'requester' ? '' : prev.bloodGroup || 'O+',
      lastDonationDate: selectedRole === 'requester' ? '' : prev.lastDonationDate,
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

    // Field checks
    const { name, email, password, phone, role, bloodGroup, city, pincode, lat, lng } = formData;
    if (!name || !email || !password || !phone || !city || !pincode) {
      setErrorMsg('Please fill in all core fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (role === 'donor' && !bloodGroup) {
      setErrorMsg('Please select your blood group.');
      return;
    }

    if (lat === '' || lng === '') {
      setErrorMsg('Please select your coordinates on the map.');
      return;
    }

    setLoading(true);

    // Prepare payLoad
    const payload = {
      name,
      email,
      password,
      phone,
      role,
      city,
      pincode,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    if (role === 'donor') {
      payload.bloodGroup = bloodGroup;
      if (formData.lastDonationDate) {
        payload.lastDonationDate = formData.lastDonationDate;
      }
    }

    const res = await signup(payload);
    setLoading(false);

    if (res.success) {
      toast.success('Registration successful! Welcome to the network.');
      if (res.role === 'donor') {
        navigate('/donor/dashboard');
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
      <div className="max-w-2xl w-full space-y-8 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-soft-border relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red"></div>

        <div className="flex flex-col items-center text-center">
          <span className="bg-brand-red/10 text-brand-red p-3.5 rounded-2xl mb-4">
            <Heart className="h-6 w-6 text-brand-red fill-current" />
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight text-ink-dark">
            Create Account
          </h2>
          <p className="mt-2 text-xs text-gray-500 max-w-sm font-medium leading-relaxed">
            Register as a Donor to save lives in coordinates emergencies, or as a Requester to issue emergency alerts.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-4 bg-clinical-bg/50 p-1.5 rounded-2xl border border-soft-border mt-8">
          <button
            type="button"
            onClick={() => handleRoleChange('requester')}
            className={`py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 flex items-center justify-center space-x-2 ${
              formData.role === 'requester'
                ? 'bg-ink-dark text-white shadow-xs'
                : 'text-gray-500 hover:text-ink-dark'
            }`}
          >
            <span>Requester</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('donor')}
            className={`py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 flex items-center justify-center space-x-2 ${
              formData.role === 'donor'
                ? 'bg-brand-red text-white shadow-xs'
                : 'text-gray-500 hover:text-brand-red'
            }`}
          >
            <Heart className={`h-4 w-4 ${formData.role === 'donor' ? 'fill-white' : ''}`} />
            <span>Donor</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-sos-red/10 border border-sos-red/25 text-sos-red px-4 py-3.5 rounded-xl text-xxs font-bold flex items-start space-x-2 animate-enter">
            <AlertCircle className="h-4 w-4 text-sos-red flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Details Block */}
            <div className="space-y-4">
              <h3 className="text-xxs font-black text-gray-400 uppercase tracking-widest border-b border-soft-border pb-2">
                1. Account Details
              </h3>
              
              <div>
                <label className="block text-xxs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-450">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                    placeholder="Enter name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
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
                    className="block w-full pl-9 pr-3 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-555 uppercase tracking-wider mb-1.5">
                  Password (6+ characters)
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
                    className="block w-full pl-9 pr-3 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-555 uppercase tracking-wider mb-1.5">
                  Phone Number
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
                    className="block w-full pl-9 pr-3 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Donor Fields & Location Setup Block */}
            <div className="space-y-4">
              <h3 className="text-xxs font-black text-gray-400 uppercase tracking-widest border-b border-soft-border pb-2">
                2. Location & Group
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-555 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-gray-555 uppercase tracking-wider mb-1.5">
                    Pincode
                  </label>
                  <input
                    name="pincode"
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono"
                    placeholder="400001"
                  />
                </div>
              </div>

              {formData.role === 'donor' && (
                <div className="grid grid-cols-2 gap-4 border-t border-soft-border pt-3 animate-enter">
                  <div>
                    <label className="block text-xxs font-bold text-brand-red uppercase tracking-wider mb-1.5">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      required={formData.role === 'donor'}
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="block w-full px-3 py-2.5 border border-brand-red/20 bg-brand-red/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red font-semibold text-ink-dark"
                    >
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
                      <span>Last Donation</span>
                      <span className="text-[9px] text-gray-400 ml-1 font-normal">(Optional)</span>
                    </label>
                    <input
                      name="lastDonationDate"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={formData.lastDonationDate}
                      onChange={handleChange}
                      className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-mono"
                    />
                  </div>
                </div>
              )}

              {formData.lat && formData.lng && (
                <div className="bg-trust-teal/5 text-trust-teal text-xxs font-black p-3.5 rounded-xl border border-trust-teal/15 flex items-center justify-between animate-enter">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Coordinates Pinpoint</span>
                  </span>
                  <span className="font-mono">
                    Lat: {parseFloat(formData.lat).toFixed(4)}, Lng: {parseFloat(formData.lng).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Map Picker section spanning full width */}
          <div className="pt-4 border-t border-soft-border">
            <MapPicker
              onChange={handleLocationChange}
              initialLat={formData.lat}
              initialLng={formData.lng}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-4 px-4 border border-transparent text-xs font-black rounded-xl text-white shadow-xs transition duration-150 disabled:opacity-50 uppercase tracking-widest ${
                formData.role === 'donor'
                  ? 'bg-brand-red hover:bg-brand-red/95'
                  : 'bg-ink-dark hover:bg-ink-dark/95'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>Register as {formData.role === 'donor' ? 'Donor' : 'Requester'}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 space-y-3">
          <p className="text-xs text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-brand-red hover:text-brand-red/90 transition duration-150">
              Sign In
            </Link>
          </p>
          <div className="pt-3 border-t border-soft-border">
            <Link to="/bloodbank/signup" className="text-xxs font-black text-gray-400 hover:text-brand-red uppercase tracking-wider transition duration-150">
              Go to Blood Bank Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
