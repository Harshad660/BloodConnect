import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import MapPicker from '../components/MapPicker';
import { 
  Heart, 
  Activity, 
  User, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  RefreshCw, 
  Award, 
  Sparkles, 
  Droplets, 
  ArrowUpRight, 
  HelpCircle, 
  BookOpen,
  HeartHandshake
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COMPATIBILITY = {
  'A+': { donate: ['A+', 'AB+'], receive: ['A+', 'A-', 'O+', 'O-'] },
  'A-': { donate: ['A+', 'A-', 'AB+', 'AB-'], receive: ['A-', 'O-'] },
  'B+': { donate: ['B+', 'AB+'], receive: ['B+', 'B-', 'O+', 'O-'] },
  'B-': { donate: ['B+', 'B-', 'AB+', 'AB-'], receive: ['B-', 'O-'] },
  'AB+': { donate: ['AB+'], receive: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { donate: ['AB+', 'AB-'], receive: ['A-', 'B-', 'AB-', 'O-'] },
  'O+': { donate: ['A+', 'B+', 'AB+', 'O+'], receive: ['O+', 'O-'] },
  'O-': { donate: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], receive: ['O-'] }
};

const DonorDashboard = () => {
  const { user, updateProfile } = useAuth();
  const { incomingSOSAlerts, setIncomingSOSAlerts, respondToSOS } = useSocket() || {};

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    bloodGroup: user?.bloodGroup || '',
    lastDonationDate: user?.lastDonationDate ? new Date(user.lastDonationDate).toISOString().split('T')[0] : '',
    lat: user?.location?.coordinates[1] || '',
    lng: user?.location?.coordinates[0] || '',
  });

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'profile', 'compatibility', 'guide'

  // Fetch incoming SOS alerts on mount
  useEffect(() => {
    fetchIncomingAlerts();
  }, []);

  // Update availability when user prop changes
  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable);
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        pincode: user.pincode || '',
        bloodGroup: user.bloodGroup || '',
        lastDonationDate: user.lastDonationDate ? new Date(user.lastDonationDate).toISOString().split('T')[0] : '',
        lat: user.location?.coordinates[1] || '',
        lng: user.location?.coordinates[0] || '',
      });
    }
  }, [user]);

  // Sync real-time socket alerts with HTTP alerts
  useEffect(() => {
    if (incomingSOSAlerts && incomingSOSAlerts.length > 0) {
      setAlerts((prev) => {
        const uniqueAlerts = [...prev];
        incomingSOSAlerts.forEach((socketAlert) => {
          const index = uniqueAlerts.findIndex((a) => a._id === socketAlert._id);
          if (index === -1) {
            uniqueAlerts.unshift({
              _id: socketAlert._id,
              requester: socketAlert.requester,
              bloodGroupNeeded: socketAlert.bloodGroupNeeded,
              urgency: socketAlert.urgency,
              hospitalName: socketAlert.hospitalName,
              location: socketAlert.location,
              contactPhone: socketAlert.contactPhone,
              status: socketAlert.status,
              createdAt: socketAlert.createdAt,
              myResponseStatus: 'pending',
            });
          }
        });
        return uniqueAlerts;
      });
    }
  }, [incomingSOSAlerts]);

  const fetchIncomingAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await api.get('/sos/incoming');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching incoming alerts:', err);
      toast.error('Failed to load incoming alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const updatedStatus = !isAvailable;
    setIsAvailable(updatedStatus);
    
    try {
      const res = await updateProfile({ isAvailable: updatedStatus });
      if (res.success) {
        toast.success(`Availability status set to ${updatedStatus ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      } else {
        setIsAvailable(isAvailable); // revert
        toast.error(res.message || 'Failed to update status');
      }
    } catch (err) {
      setIsAvailable(isAvailable); // revert
      toast.error('Error updating status');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    const payload = {
      name: profileData.name,
      phone: profileData.phone,
      city: profileData.city,
      pincode: profileData.pincode,
      bloodGroup: profileData.bloodGroup,
      lastDonationDate: profileData.lastDonationDate || null,
    };

    if (profileData.lat && profileData.lng) {
      payload.lat = parseFloat(profileData.lat);
      payload.lng = parseFloat(profileData.lng);
    }

    const res = await updateProfile(payload);
    setProfileLoading(false);

    if (res.success) {
      toast.success('Profile details updated successfully!');
      setActiveTab('alerts');
    } else {
      toast.error(res.message || 'Failed to update profile');
    }
  };

  const handleLocationChange = ({ lat, lng }) => {
    setProfileData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  const handleRespond = async (sosId, responseStatus) => {
    try {
      if (respondToSOS) {
        respondToSOS(sosId, responseStatus);
      }

      const res = await api.put(`/sos/${sosId}/respond`, { status: responseStatus });
      if (res.data.success) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert._id === sosId ? { ...alert, myResponseStatus: responseStatus } : alert
          )
        );

        if (setIncomingSOSAlerts) {
          setIncomingSOSAlerts((prev) => prev.filter((a) => a._id !== sosId));
        }

        toast.success(`SOS request ${responseStatus}!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    }
  };

  // Calculations for Stats
  const pendingAlerts = alerts.filter((a) => a.myResponseStatus === 'pending' && a.status === 'pending');
  const historyAlerts = alerts.filter((a) => a.myResponseStatus !== 'pending' || a.status !== 'pending');
  
  const acceptedResponsesCount = historyAlerts.filter(a => a.myResponseStatus === 'accepted').length;
  const initialDonation = user?.lastDonationDate ? 1 : 0;
  const totalDonations = acceptedResponsesCount + initialDonation;
  const livesSaved = totalDonations * 3;

  // Gamification Tier
  const getHeroTier = (donations) => {
    if (donations >= 6) {
      return { 
        name: 'Immortal Hero', 
        badge: '👑', 
        nextAt: 999, 
        progress: 100, 
        color: 'from-amber-500 to-yellow-600 border-amber-400 text-amber-700 bg-amber-50' 
      };
    } else if (donations >= 4) {
      return { 
        name: 'Red Cross Champion', 
        badge: '🏆', 
        nextAt: 6, 
        progress: Math.round(((donations - 4) / 2) * 100), 
        color: 'from-rose-500 to-pink-600 border-rose-400 text-rose-700 bg-rose-50' 
      };
    } else if (donations >= 2) {
      return { 
        name: 'Guardian Angel', 
        badge: '✨', 
        nextAt: 4, 
        progress: Math.round(((donations - 2) / 2) * 100), 
        color: 'from-purple-500 to-indigo-600 border-purple-400 text-purple-700 bg-purple-50' 
      };
    } else if (donations >= 1) {
      return { 
        name: 'Life Saver', 
        badge: '❤️', 
        nextAt: 2, 
        progress: Math.round(((donations - 1) / 1) * 100), 
        color: 'from-blue-500 to-teal-600 border-blue-400 text-blue-700 bg-blue-50' 
      };
    } else {
      return { 
        name: 'Guardian Recruit', 
        badge: '🛡️', 
        nextAt: 1, 
        progress: 0, 
        color: 'from-gray-400 to-slate-600 border-gray-300 text-gray-700 bg-gray-50' 
      };
    }
  };
  const heroTier = getHeroTier(totalDonations);

  // Eligibility Calculation (90 days cooldown)
  const getEligibility = () => {
    if (!user?.lastDonationDate) {
      return { isEligible: true, daysLeft: 0, percentage: 100 };
    }
    const lastDate = new Date(user.lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const COOLDOWN_DAYS = 90;
    
    if (diffDays >= COOLDOWN_DAYS) {
      return { isEligible: true, daysLeft: 0, percentage: 100 };
    } else {
      const daysLeft = COOLDOWN_DAYS - diffDays;
      const progressPercent = Math.round((diffDays / COOLDOWN_DAYS) * 100);
      return { isEligible: false, daysLeft, percentage: progressPercent };
    }
  };
  const eligibility = getEligibility();

  // Compatibility groups
  const compatibility = BLOOD_COMPATIBILITY[user?.bloodGroup] || { donate: [], receive: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gray-50/20 min-h-screen">
      
      {/* Redesigned Hero Welcomer */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blood-600 to-rose-700 rounded-3xl shadow-xl border border-red-500/10 p-8 sm:p-10 text-white">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-red-800/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                Welcome back, {user?.name}!
              </span>
              {user?.isVerified && (
                <span className="bg-emerald-500/25 text-emerald-300 text-xxs font-extrabold px-3 py-1 rounded-full flex items-center border border-emerald-400/30 backdrop-blur-sm shadow-inner animate-pulse">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" />
                  Verified Hero
                </span>
              )}
            </div>
            <p className="text-rose-105 text-sm max-w-xl font-medium leading-relaxed">
              "Your donation has the power to light up someone's dark day. Every drop of blood represents another heartbeat, another hope, and another life saved."
            </p>
          </div>

          {/* Toggle availability inside hero panel */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center justify-between gap-5 w-full md:w-auto shadow-lg">
            <div className="text-left">
              <span className="text-xxs uppercase tracking-wider text-red-200 font-extrabold block">Donation Status</span>
              <span className={`text-xs font-black ${isAvailable ? 'text-emerald-400' : 'text-rose-200'}`}>
                {isAvailable ? '● Available to Donate' : '○ Offline / Unavailable'}
              </span>
            </div>
            <button
              onClick={handleAvailabilityToggle}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 outline-none ${
                isAvailable ? 'bg-emerald-500 shadow-md shadow-emerald-600/30' : 'bg-white/20'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  isAvailable ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Lives Saved */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 hover:shadow-md transition duration-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-blood-600">
            <Heart className="h-16 w-16 fill-current animate-pulse animate-pulse-fast" />
          </div>
          <div>
            <span className="text-xxs font-extrabold uppercase tracking-wider text-gray-400">Total Lives Saved</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-gray-900 font-display">{livesSaved}</span>
              <span className="text-blood-600 font-bold text-xs">+{totalDonations} Donation{totalDonations !== 1 && 's'}</span>
            </div>
          </div>
          <p className="text-xxs text-gray-500 font-medium mt-3 border-t border-gray-100 pt-3">
            Each blood donation can save up to 3 lives. Thank you!
          </p>
        </div>

        {/* Card 2: Blood Compatibility */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 hover:shadow-md transition duration-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-rose-600">
            <Droplets className="h-16 w-16 fill-current" />
          </div>
          <div>
            <span className="text-xxs font-extrabold uppercase tracking-wider text-gray-400">Your Blood Group</span>
            <div className="flex items-center space-x-3 mt-2">
              <span className="bg-rose-50 text-blood-600 h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-rose-100">
                {user?.bloodGroup || 'N/A'}
              </span>
              <div>
                <span className="text-xxs text-gray-500 block font-semibold leading-tight">Compatible recipients:</span>
                <span className="text-xs font-black text-gray-800 tracking-tight">
                  {compatibility.donate.join(', ')}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xxs text-gray-500 font-medium mt-3 border-t border-gray-100 pt-3">
            Click the <strong className="text-blood-600 cursor-pointer" onClick={() => setActiveTab('compatibility')}>Compatibility tab</strong> for details.
          </p>
        </div>

        {/* Card 3: Eligibility Tracker */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 hover:shadow-md transition duration-200 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <span className="text-xxs font-extrabold uppercase tracking-wider text-gray-400">Next Donation Eligibility</span>
            
            {eligibility.isEligible ? (
              <div className="flex items-center space-x-2 mt-2 text-emerald-600">
                <span className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-bold animate-bounce">
                  ✓
                </span>
                <div>
                  <span className="text-xs font-black block">Eligible to Donate</span>
                  <span className="text-[10px] text-gray-500">Ready to save lives today!</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-gray-900 font-display">{eligibility.daysLeft}</span>
                  <span className="text-xxs text-amber-600 font-bold">Days Cooldown</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-50">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${eligibility.percentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xxs text-gray-500 font-medium mt-3 border-t border-gray-100 pt-3">
            Cooldown period is 90 days between donations.
          </p>
        </div>

        {/* Card 4: Hero Ranking */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 hover:shadow-md transition duration-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-amber-500">
            <Award className="h-16 w-16 animate-pulse" />
          </div>
          <div>
            <span className="text-xxs font-extrabold uppercase tracking-wider text-gray-400">Donor Rank Tier</span>
            <div className="flex items-center space-x-3 mt-2">
              <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-2xl shadow-sm">
                {heroTier.badge}
              </span>
              <div>
                <span className="text-xs font-black text-gray-800 block">{heroTier.name}</span>
                <span className="text-[10px] text-gray-500 font-semibold">{totalDonations} Donation{totalDonations !== 1 && 's'} logged</span>
              </div>
            </div>
          </div>
          
          {/* Progress to next tier */}
          <div className="mt-3 border-t border-gray-100 pt-3">
            {heroTier.nextAt === 999 ? (
              <span className="text-xxs text-amber-600 font-black">Ultimate Tier Achieved! 🏆</span>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                  <span>Progress to Next Rank</span>
                  <span>{totalDonations} / {heroTier.nextAt}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${heroTier.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-3.5 px-6 text-sm font-bold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'alerts'
              ? 'border-blood-600 text-blood-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-950'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>SOS Requests</span>
          <span className={`px-2 py-0.5 rounded-full text-xxs font-extrabold ${
            activeTab === 'alerts' ? 'bg-red-50 text-blood-600 border border-red-100' : 'bg-gray-100 text-gray-500'
          }`}>
            {pendingAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compatibility')}
          className={`py-3.5 px-6 text-sm font-bold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'compatibility'
              ? 'border-blood-600 text-blood-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-950'
          }`}
        >
          <Droplets className="h-4 w-4" />
          <span>Compatibility Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`py-3.5 px-6 text-sm font-bold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'guide'
              ? 'border-blood-600 text-blood-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-950'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Donation Guidelines</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-6 text-sm font-bold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'profile'
              ? 'border-blood-600 text-blood-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-950'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Render active tabs */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main SOS alert panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
              <h2 className="text-base font-bold text-gray-805 flex items-center space-x-2">
                <HeartHandshake className="h-5 w-5 text-blood-600" />
                <span>Active SOS Requests ({pendingAlerts.length})</span>
              </h2>
              <button
                onClick={fetchIncomingAlerts}
                className="text-gray-400 hover:text-blood-600 p-2 rounded-xl hover:bg-red-50 border border-gray-100 hover:border-red-100 transition duration-150"
                title="Refresh Alerts"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {alertsLoading ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-gray-150">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-9 h-9 border-4 border-blood-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xxs font-bold text-gray-400">Loading incoming alerts...</span>
                </div>
              </div>
            ) : pendingAlerts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 border border-gray-150 text-center space-y-4 shadow-sm">
                <span className="text-4xl text-center block">🕊️</span>
                <div className="space-y-1">
                  <p className="font-bold text-gray-700 text-sm">All Quiet Right Now</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    No active SOS requests matching your blood type are in your area. You'll be notified here if an emergency occurs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-red-100 hover:border-red-200 transition duration-200 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group"
                  >
                    {/* Left urgent indicator strip */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      alert.urgency === 'critical' ? 'bg-blood-600' : alert.urgency === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>

                    <div className="space-y-4 flex-1 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-gradient-to-r from-blood-600 to-rose-600 text-white font-extrabold text-xs px-3.5 py-1 rounded-xl shadow-sm">
                          {alert.bloodGroupNeeded} Needed
                        </span>
                        
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                            alert.urgency === 'critical'
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : alert.urgency === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {alert.urgency} urgency
                        </span>
                        
                        <span className="text-xxs text-gray-400 font-semibold flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-gray-800 font-display">{alert.hospitalName}</h3>
                        <p className="text-xxs text-gray-400 font-semibold mt-0.5">SOS Area Request</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Requester: {alert.requester?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${alert.contactPhone}`} className="hover:underline font-bold text-blood-600">
                            {alert.contactPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-3 items-center min-w-[160px] border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                      {/* Accept Button */}
                      <button
                        onClick={() => handleRespond(alert._id, 'accepted')}
                        className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 transition duration-155"
                      >
                        <Check className="h-4 w-4" />
                        <span>Accept SOS</span>
                      </button>

                      {/* Map Location Direct Button */}
                      {alert.location?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${alert.location.coordinates[1]},${alert.location.coordinates[0]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full md:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition duration-155"
                        >
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>Show Route</span>
                          <ArrowUpRight className="h-3 w-3 text-slate-400" />
                        </a>
                      )}

                      {/* Decline Button */}
                      <button
                        onClick={() => handleRespond(alert._id, 'declined')}
                        className="w-full md:w-auto text-gray-450 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl text-xxs flex items-center justify-center space-x-1 transition duration-155"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline SOS</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Timeline of Heroic Responses */}
          <div className="lg:col-span-4 space-y-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-150">
            <h2 className="text-sm font-extrabold text-gray-805 flex items-center space-x-1.5 uppercase tracking-wider pb-3 border-b border-gray-100">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Response Mission Log</span>
            </h2>

            <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
              {historyAlerts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-2xl opacity-50 block">🪵</span>
                  <p className="text-xxs text-gray-400 italic">No past response missions logged.</p>
                </div>
              ) : (
                <div className="relative border-l border-gray-100 pl-4 space-y-6">
                  {historyAlerts.map((hAlert) => (
                    <div key={hAlert._id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 bg-white ${
                        hAlert.myResponseStatus === 'accepted' ? 'border-emerald-500' : 'border-rose-500'
                      }`}></span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-gray-805 text-xs leading-tight">
                            {hAlert.hospitalName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              hAlert.myResponseStatus === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            {hAlert.myResponseStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Blood Request: <strong className="text-gray-700">{hAlert.bloodGroupNeeded}</strong> Needed
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold">
                          Logged: {new Date(hAlert.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Matrix Tab */}
      {activeTab === 'compatibility' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150 max-w-4xl mx-auto space-y-8">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 font-display">Blood Compatibility Matrix</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your blood type determines who can receive your donation, and whose donation you can safely receive. Below is the custom compatibility sheet for your type.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Can Donate To card */}
            <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl border border-rose-100/70 space-y-4">
              <div className="flex items-center space-x-2 text-blood-600">
                <Heart className="h-5 w-5 fill-current" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">You Can Donate To</h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {compatibility.donate.map((group) => (
                  <span key={group} className="h-12 w-12 rounded-xl bg-blood-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-red-500/10">
                    {group}
                  </span>
                ))}
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed pt-2">
                {user?.bloodGroup === 'O-' ? (
                  <strong>Universal Donor:</strong> + "Your red blood cells can be transfused to all patients, making it highly valuable in emergencies."
                ) : (
                  `As an ${user?.bloodGroup} donor, your red blood cells can be transfused safely to these groups.`
                )}
              </p>
            </div>

            {/* Can Receive From card */}
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100/70 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">You Can Receive From</h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {compatibility.receive.map((group) => (
                  <span key={group} className="h-12 w-12 rounded-xl bg-white text-emerald-700 border-2 border-emerald-300 font-black flex items-center justify-center text-sm shadow-sm">
                    {group}
                  </span>
                ))}
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed pt-2">
                {user?.bloodGroup === 'AB+' ? (
                  <strong>Universal Recipient:</strong> + "You can safely receive red blood cells from any blood group type in an emergency."
                ) : (
                  `If you ever need blood, you can safely receive transfusions from these blood types.`
                )}
              </p>
            </div>
          </div>

          {/* Full Grid Chart */}
          <div className="border border-gray-150 rounded-2xl p-6 bg-gray-50/50 space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">General Grid Quick Reference</h4>
            <div className="overflow-x-auto text-[10px]">
              <table className="min-w-full text-center border-collapse text-gray-655">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 font-extrabold text-left text-gray-400">Donor Type</th>
                    {BLOOD_GROUPS.map((bg) => (
                      <th key={bg} className="py-2 font-extrabold text-gray-800">{bg}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BLOOD_GROUPS.map((donorGroup) => (
                    <tr key={donorGroup} className="hover:bg-white/80">
                      <td className="py-2.5 font-bold text-left text-gray-800">{donorGroup}</td>
                      {BLOOD_GROUPS.map((recGroup) => {
                        const canDonate = BLOOD_COMPATIBILITY[donorGroup].donate.includes(recGroup);
                        return (
                          <td key={recGroup} className="py-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded font-extrabold ${
                              canDonate ? 'bg-red-50 text-blood-600' : 'text-gray-300'
                            }`}>
                              {canDonate ? '✔' : '•'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Tab */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150 max-w-4xl mx-auto space-y-8">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-800 font-display">Donation Guidelines</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Making sure you are healthy and fully prepared simplifies the process and guarantees your donation goes smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Before */}
            <div className="p-6 border border-gray-100 rounded-2xl space-y-4 hover:border-red-100 hover:shadow-sm transition">
              <span className="bg-red-50 text-blood-600 px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider">
                1. Before Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-600 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-red-500">💧</span>
                  <span><strong>Stay Hydrated:</strong> Drink plenty of water or juice (approx. 500ml) right before.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-red-500">🥗</span>
                  <span><strong>Eat Healthy:</strong> Eat a meal rich in iron. Avoid fatty foods which interfere with testing.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-red-500">💤</span>
                  <span><strong>Rest Well:</strong> Sleep a full 7-8 hours the night prior.</span>
                </li>
              </ul>
            </div>

            {/* Step 2: During */}
            <div className="p-6 border border-gray-100 rounded-2xl space-y-4 hover:border-red-100 hover:shadow-sm transition">
              <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider">
                2. During Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-600 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">🧘</span>
                  <span><strong>Relax:</strong> Wear comfortable sleeves. Take deep breaths or chat with the staff.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">⏱️</span>
                  <span><strong>Quick Process:</strong> The actual blood draw takes only 8 to 12 minutes!</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">🛡️</span>
                  <span><strong>Safe Equipment:</strong> Sterile, single-use needles are always used for your safety.</span>
                </li>
              </ul>
            </div>

            {/* Step 3: After */}
            <div className="p-6 border border-gray-100 rounded-2xl space-y-4 hover:border-red-100 hover:shadow-sm transition">
              <span className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider">
                3. After Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-650 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-emerald-500">🥤</span>
                  <span><strong>Have Snacks:</strong> Rest for 10-15 minutes at the center and have the provided snacks.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-emerald-500">🏋️</span>
                  <span><strong>Limit Strain:</strong> Avoid heavy lifting or strenuous physical exercise for the next 5-6 hours.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-emerald-500">📅</span>
                  <span><strong>Next Date:</strong> Wait 90 days (12 weeks) before your next whole blood contribution.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-150 mx-auto">
          <h2 className="text-base font-black text-gray-800 border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
            Edit Profile Settings
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={profileData.city}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  value={profileData.pincode}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, pincode: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-blood-600 uppercase tracking-wider mb-1.5">
                  Blood Group
                </label>
                <select
                  required
                  value={profileData.bloodGroup}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                  className="block w-full px-3 py-2.5 border border-red-200 bg-red-50/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Last Donation Date
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={profileData.lastDonationDate}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, lastDonationDate: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-blood-600"
                />
              </div>
            </div>

            {profileData.lat && profileData.lng && (
              <div className="bg-red-50 text-red-800 text-xxs font-bold p-3.5 rounded-xl border border-red-100 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Map Pinpoint Coordinates Registered</span>
                </span>
                <span>
                  Lat: {parseFloat(profileData.lat).toFixed(4)}, Lng: {parseFloat(profileData.lng).toFixed(4)}
                </span>
              </div>
            )}

            {/* Map Picker for updating address coordinates */}
            <div className="pt-2">
              <MapPicker
                onChange={handleLocationChange}
                initialLat={profileData.lat}
                initialLng={profileData.lng}
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-gradient-to-r from-blood-600 to-blood-700 hover:from-blood-700 hover:to-blood-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {profileLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Save Profile Updates</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
