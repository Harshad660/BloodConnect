import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker';
import api from '../services/api';
import { Heart, AlertTriangle, MapPin, Phone, Building2, Sliders, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = [
  { value: 'low', label: 'Low (Scheduled/Backup)', color: 'border-blue-200 text-blue-700 bg-blue-50/50' },
  { value: 'medium', label: 'Medium (Required within 24h)', color: 'border-orange-200 text-orange-700 bg-orange-50/50' },
  { value: 'critical', label: 'Critical (URGENT - Required Instantly)', color: 'border-red-200 text-red-700 bg-red-50' },
];

const CreateSOS = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    bloodGroupNeeded: '',
    urgency: 'critical', // default
    hospitalName: '',
    contactPhone: '',
    radius: 10, // default 10km
    lat: '',
    lng: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

    const { bloodGroupNeeded, urgency, hospitalName, contactPhone, radius, lat, lng } = formData;

    if (!bloodGroupNeeded || !urgency || !hospitalName || !contactPhone) {
      setErrorMsg('Please fill in all details.');
      return;
    }

    if (lat === '' || lng === '') {
      setErrorMsg('Please pinpoint the hospital location on the map.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/sos', {
        bloodGroupNeeded,
        urgency,
        hospitalName,
        contactPhone,
        radius: parseFloat(radius),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });

      if (res.data.success) {
        const count = res.data.notifiedCount || 0;
        toast.success(`SOS Broadcast sent! ${count} matching donors notified near hospital.`, {
          duration: 7000,
        });
        navigate('/requester/dashboard');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to broadcast SOS request.';
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-150 relative">
        <div className="absolute top-0 inset-x-0 h-2 bg-red-600 rounded-t-3xl"></div>

        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 mb-8">
          <span className="bg-red-100 text-red-600 p-3.5 rounded-2xl shadow-sm mb-4 animate-bounce">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </span>
          <h1 className="text-3xl font-black font-display tracking-tight text-gray-900">
            Emergency SOS Broadcast
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            Broadcast an instant emergency alert. All online donors with matching blood groups in the specified radius will receive real-time popups.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 mb-6 animate-enter">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details panel */}
            <div className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-red-600 uppercase tracking-wider mb-2">
                  Blood Group Required *
                </label>
                <select
                  name="bloodGroupNeeded"
                  required
                  value={formData.bloodGroupNeeded}
                  onChange={handleChange}
                  className="block w-full px-3.5 py-3 border border-red-200 bg-red-50/20 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="">Select Required Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Urgency Priority *
                </label>
                <div className="space-y-2">
                  {URGENCY_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer text-xs transition font-semibold hover:border-gray-300 ${
                        formData.urgency === level.value
                          ? `${level.color} border-red-600 ring-1 ring-red-500/25`
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      <span>{level.label}</span>
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={formData.urgency === level.value}
                        onChange={handleChange}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500 accent-red-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Hospital details panel */}
            <div className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Hospital Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <input
                    name="hospitalName"
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    placeholder="e.g. City General Hospital"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Contact Phone *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    name="contactPhone"
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    placeholder="Coordination phone number"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider">
                    Target Alert Radius Range
                  </label>
                  <span className="text-xs font-bold text-red-600 flex items-center">
                    <Sliders className="h-3.5 w-3.5 mr-1" />
                    <span>{formData.radius} km</span>
                  </span>
                </div>
                <input
                  type="range"
                  name="radius"
                  min="2"
                  max="50"
                  value={formData.radius}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              {formData.lat && formData.lng && (
                <div className="bg-red-50 text-red-800 text-xxs font-bold p-3.5 rounded-xl border border-red-100 flex items-center justify-between animate-enter">
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Hospital Coordinates Anchored</span>
                  </span>
                  <span>
                    Lat: {parseFloat(formData.lat).toFixed(4)}, Lng: {parseFloat(formData.lng).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="pt-4 border-t border-gray-100">
            <MapPicker
              onChange={handleLocationChange}
              initialLat={formData.lat}
              initialLng={formData.lng}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 px-4 rounded-xl text-sm shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center space-x-1">
                  <span>Broadcast Urgent SOS</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSOS;
