import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker';
import api from '../services/api';
import { AlertTriangle, MapPin, Phone, Building2, Sliders, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = [
  { value: 'low', label: 'Backup / Scheduled', description: 'No immediate danger, required as pre-planned backup.', color: 'border-soft-border text-gray-500 bg-white' },
  { value: 'medium', label: 'Elevated Need (24h)', description: 'Required within 24 hours for surgery or replenishment.', color: 'border-amber-200 text-amber-800 bg-amber-50/20' },
  { value: 'critical', label: 'Vivid Critical (Urgent)', description: 'Life-threatening emergency. Required immediately.', color: 'border-sos-red/30 text-sos-red bg-sos-red/5' },
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
      setErrorMsg('Please specify all details before broadcasting.');
      return;
    }

    if (lat === '' || lng === '') {
      setErrorMsg('Please select the hospital coordinates on the map.');
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
        toast.success(`SOS Broadcast initiated! ${count} matching donors targeted in range.`, {
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
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-soft-border relative overflow-hidden">
        
        {/* Urgent indicator top strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-sos-red"></div>

        <div className="flex flex-col items-center text-center pb-6 border-b border-soft-border mb-8">
          <span className="bg-sos-red/10 text-sos-red p-3.5 rounded-2xl mb-4 relative flex h-14 w-14 items-center justify-center">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-sos-red/15 opacity-75"></span>
            <AlertTriangle className="h-7 w-7 text-sos-red relative" />
          </span>
          <h1 className="text-3xl font-black font-display tracking-tight text-ink-dark">
            Emergency SOS Broadcast
          </h1>
          <p className="mt-2 text-xs text-gray-500 max-w-md font-medium leading-relaxed">
            Broadcast a real-time geo-located matching request. This triggers instant push alerts to matching online donors and institutions within your specified perimeter.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-sos-red/10 border border-sos-red/35 text-sos-red px-4 py-3.5 rounded-xl text-xs font-bold flex items-start space-x-2 mb-6 animate-enter">
            <AlertTriangle className="h-4 w-4 text-sos-red flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Blood Group and Urgency */}
          <div className="space-y-5">
            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-widest mb-3">
                1. Blood Type Required *
              </label>
              
              {/* Tactile Selector Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, bloodGroupNeeded: bg }))}
                    className={`py-3.5 text-center text-sm font-mono rounded-xl border font-bold transition duration-150 ${
                      formData.bloodGroupNeeded === bg
                        ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm shadow-brand-red/10'
                        : 'border-soft-border bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-widest mb-3">
                2. Urgency Level *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgency: level.value }))}
                    className={`p-4 border rounded-2xl cursor-pointer text-left transition flex flex-col justify-between ${
                      formData.urgency === level.value
                        ? `${level.color} border-brand-red ring-1 ring-brand-red/20`
                        : 'border-soft-border bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-extrabold uppercase tracking-wide block">{level.label}</span>
                    <span className="text-[10px] text-gray-400 mt-1 font-medium leading-relaxed">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Hospital and Location details */}
          <div className="space-y-5 pt-6 border-t border-soft-border">
            <h3 className="text-xxs font-black text-gray-500 uppercase tracking-widest">
              3. Hospital Coordination Details *
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">
                  Hospital Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    name="hospitalName"
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-3 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
                    placeholder="e.g. City General Hospital"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    name="contactPhone"
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-3 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
                    placeholder="Direct coordination phone number"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-gray-500">
                  Target Alert Radius
                </label>
                <span className="text-xs font-black text-brand-red bg-brand-red/5 px-2 py-0.5 rounded-md font-mono flex items-center">
                  <Sliders className="h-3.5 w-3.5 mr-1" />
                  <span>{formData.radius} KM</span>
                </span>
              </div>
              <input
                type="range"
                name="radius"
                min="2"
                max="50"
                value={formData.radius}
                onChange={handleChange}
                className="w-full h-2 bg-clinical-bg rounded-lg appearance-none cursor-pointer accent-brand-red"
              />
            </div>

            {formData.lat && formData.lng && (
              <div className="bg-trust-teal/5 text-trust-teal text-xxs font-black p-3.5 rounded-xl border border-trust-teal/15 flex items-center justify-between animate-enter">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Hospital Coordinates Anchored</span>
                </span>
                <span className="font-mono">
                  Lat: {parseFloat(formData.lat).toFixed(4)}, Lng: {parseFloat(formData.lng).toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Map Section */}
          <div className="pt-6 border-t border-soft-border">
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
              className="w-full bg-sos-red hover:bg-sos-red/95 text-white font-extrabold py-4 px-4 rounded-xl text-xs tracking-widest uppercase shadow-md transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>Send SOS Request</span>
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
