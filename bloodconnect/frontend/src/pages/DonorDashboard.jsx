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
        name: 'Red Angel Coordinator', 
        badge: '✨', 
        nextAt: 4, 
        progress: Math.round(((donations - 2) / 2) * 100), 
        color: 'from-purple-500 to-indigo-600 border-purple-400 text-purple-700 bg-purple-50' 
      };
    } else if (donations >= 1) {
      return { 
        name: 'Life Saver Partner', 
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
        color: 'from-gray-450 to-slate-600 border-gray-300 text-gray-700 bg-gray-50' 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-clinical-bg min-h-screen">
      
      {/* Redesigned Hero Welcomer */}
      <div className="relative overflow-hidden bg-ink-dark rounded-3xl shadow-sm border border-soft-border p-8 sm:p-10 text-white">
        {/* Subtle heartbeat background grid line */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#C81E3A_1px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                Welcome, {user?.name}
              </span>
              {user?.isVerified && (
                <span className="bg-trust-teal/10 text-trust-teal text-xxs font-extrabold px-3 py-1 rounded-full flex items-center border border-trust-teal/30 backdrop-blur-xs">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-trust-teal" />
                  Verified Saver
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm max-w-xl font-medium leading-relaxed">
              Your coordinate markers link you directly to active hospital perimeters. Stand ready. Toggle your state below to notify emergency crews of your availability.
            </p>
          </div>

          {/* Availability switch container */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-5 w-full md:w-auto shadow-sm">
            <div className="text-left">
              <span className="text-xxs uppercase tracking-widest text-gray-500 font-black block">Geospatial State</span>
              <span className={`text-xs font-bold ${isAvailable ? 'text-trust-teal' : 'text-gray-400'}`}>
                {isAvailable ? '● Available to Donate' : '○ Offline / Cooldown'}
              </span>
            </div>
            <button
              onClick={handleAvailabilityToggle}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 outline-none ${
                isAvailable ? 'bg-trust-teal shadow shadow-trust-teal/30' : 'bg-white/10'
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
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-brand-red">
            <Heart className="h-16 w-16 fill-current animate-pulse-fast" />
          </div>
          <div>
            <span className="text-xxs font-black uppercase tracking-widest text-gray-400">Total Lives Saved</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-ink-dark font-display">{livesSaved}</span>
              <span className="text-brand-red font-bold text-xs bg-brand-red/5 px-2 py-0.5 rounded">+{totalDonations} Match{totalDonations !== 1 && 'es'}</span>
            </div>
          </div>
          <p className="text-xxs text-gray-500 font-semibold mt-3 border-t border-soft-border pt-3">
            Each blood donation can save up to 3 lives.
          </p>
        </div>

        {/* Card 2: Blood Compatibility */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-brand-red">
            <Droplets className="h-16 w-16 fill-current" />
          </div>
          <div>
            <span className="text-xxs font-black uppercase tracking-widest text-gray-400">Your Blood Group</span>
            <div className="flex items-center space-x-3 mt-2">
              <span className="wristband-badge font-black text-lg py-1 px-3">
                {user?.bloodGroup || 'N/A'}
              </span>
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold leading-none mb-1">Compatible recipients:</span>
                <span className="text-xs font-bold text-ink-dark tracking-tight">
                  {compatibility.donate.join(', ')}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xxs text-gray-500 font-semibold mt-3 border-t border-soft-border pt-3">
            Check the <strong className="text-brand-red cursor-pointer" onClick={() => setActiveTab('compatibility')}>Compatibility tab</strong> for details.
          </p>
        </div>

        {/* Card 3: Eligibility Tracker */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border flex flex-col justify-between relative overflow-hidden group">
          <div>
            <span className="text-xxs font-black uppercase tracking-widest text-gray-400">Donation Cooldown</span>
            
            {eligibility.isEligible ? (
              <div className="flex items-center space-x-2 mt-2 text-trust-teal">
                <span className="h-8 w-8 rounded-full bg-trust-teal/10 border border-trust-teal/20 flex items-center justify-center text-sm font-bold">
                  ✓
                </span>
                <div>
                  <span className="text-xs font-black block">Eligible to Donate</span>
                  <span className="text-[10px] text-gray-400">Ready to save lives today.</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-ink-dark font-display">{eligibility.daysLeft}</span>
                  <span className="text-xxs text-amber-600 font-bold uppercase tracking-wider">Days Cooldown</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-clinical-bg rounded-full h-2 overflow-hidden border border-soft-border">
                  <div 
                    className="bg-brand-red h-full rounded-full transition-all duration-500" 
                    style={{ width: `${eligibility.percentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xxs text-gray-500 font-semibold mt-3 border-t border-soft-border pt-3">
            Requires a 90-day physical recovery interval.
          </p>
        </div>

        {/* Card 4: Hero Ranking */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-300 text-amber-500">
            <Award className="h-16 w-16" />
          </div>
          <div>
            <span className="text-xxs font-black uppercase tracking-widest text-gray-400">Donor Badge Class</span>
            <div className="flex items-center space-x-3 mt-2">
              <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
                {heroTier.badge}
              </span>
              <div>
                <span className="text-xs font-black text-ink-dark block leading-none mb-1">{heroTier.name}</span>
                <span className="text-[10px] text-gray-400 font-bold">{totalDonations} donation{totalDonations !== 1 && 's'} logged</span>
              </div>
            </div>
          </div>
          
          {/* Progress to next tier */}
          <div className="mt-3 border-t border-soft-border pt-3">
            {heroTier.nextAt === 999 ? (
              <span className="text-xxs text-amber-600 font-black">Ultimate Tier Achieved! 🏆</span>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                  <span>Next Class Milestone</span>
                  <span>{totalDonations} / {heroTier.nextAt}</span>
                </div>
                <div className="w-full bg-clinical-bg rounded-full h-1.5 overflow-hidden">
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
      <div className="flex border-b border-soft-border overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-3.5 px-6 text-xs uppercase tracking-wider font-extrabold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'alerts'
              ? 'border-brand-red text-brand-red font-black'
              : 'border-transparent text-gray-400 hover:text-ink-dark'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Active SOS Matches</span>
          <span className={`px-2 py-0.5 rounded-full text-xxs font-extrabold ${
            activeTab === 'alerts' ? 'bg-brand-red/5 text-brand-red border border-brand-red/10' : 'bg-clinical-bg text-gray-500'
          }`}>
            {pendingAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compatibility')}
          className={`py-3.5 px-6 text-xs uppercase tracking-wider font-extrabold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'compatibility'
              ? 'border-brand-red text-brand-red font-black'
              : 'border-transparent text-gray-400 hover:text-ink-dark'
          }`}
        >
          <Droplets className="h-4 w-4" />
          <span>Compatibility Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`py-3.5 px-6 text-xs uppercase tracking-wider font-extrabold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'guide'
              ? 'border-brand-red text-brand-red font-black'
              : 'border-transparent text-gray-400 hover:text-ink-dark'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Preparation Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-6 text-xs uppercase tracking-wider font-extrabold border-b-2 transition duration-155 flex items-center space-x-2 ${
            activeTab === 'profile'
              ? 'border-brand-red text-brand-red font-black'
              : 'border-transparent text-gray-400 hover:text-ink-dark'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Configure Profile</span>
        </button>
      </div>

      {/* Render active tabs */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main SOS alert panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-soft-border shadow-xs">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                <HeartHandshake className="h-4 w-4 text-brand-red" />
                <span>Geospatial Match Targets ({pendingAlerts.length})</span>
              </h2>
              <button
                onClick={fetchIncomingAlerts}
                className="text-gray-405 hover:text-brand-red p-2 rounded-xl hover:bg-brand-red/5 border border-soft-border transition duration-155"
                title="Refresh Alerts"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {alertsLoading ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-soft-border shadow-xs">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xxs font-bold text-gray-400 font-mono">Querying live socket lines...</span>
                </div>
              </div>
            ) : pendingAlerts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 border border-soft-border text-center space-y-3 shadow-xs">
                <span className="text-4xl text-center block">🕊️</span>
                <div className="space-y-1">
                  <p className="font-extrabold text-ink-dark text-sm">No Active Emergency Broadcasts</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                    No active hospital SOS coordinates are mapped to your perimeters. We'll issue a sound notify immediately if a match triggers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border hover:border-brand-red/20 transition duration-200 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group"
                  >
                    {/* Left urgent indicator strip */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                      alert.urgency === 'critical' ? 'bg-sos-red animate-pulse' : 'bg-amber-500'
                    }`}></div>

                    <div className="space-y-4 flex-1 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="wristband-badge font-mono font-bold text-xs py-1 px-3">
                          {alert.bloodGroupNeeded} Required
                        </span>
                        
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                            alert.urgency === 'critical'
                              ? 'bg-sos-red/10 text-sos-red animate-pulse'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {alert.urgency} Priority
                        </span>
                        
                        <span className="text-xxs text-gray-400 font-semibold flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-ink-dark font-display">{alert.hospitalName}</h3>
                        <p className="text-xxs text-gray-400 font-semibold mt-0.5">Clinical Coordinates Broadcast</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-soft-border pt-3">
                        <div className="flex items-center space-x-2 text-gray-655 font-medium">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Requester: {alert.requester?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-655 font-medium">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${alert.contactPhone}`} className="hover:underline font-black text-brand-red font-mono">
                            {alert.contactPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-3.5 items-stretch md:items-end min-w-[160px] border-t md:border-t-0 border-soft-border pt-4 md:pt-0">
                      {/* Accept Button */}
                      <button
                        onClick={() => handleRespond(alert._id, 'accepted')}
                        className="bg-trust-teal hover:bg-trust-teal/95 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition duration-155"
                      >
                        <Check className="h-4 w-4" />
                        <span>Accept Mission</span>
                      </button>

                      {/* Map Location Direct Button */}
                      {alert.location?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${alert.location.coordinates[1]},${alert.location.coordinates[0]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-clinical-bg hover:bg-gray-100 text-ink-dark border border-soft-border font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition duration-155"
                        >
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>Open Google Maps</span>
                          <ArrowUpRight className="h-3 w-3 text-gray-400" />
                        </a>
                      )}

                      {/* Decline Button */}
                      <button
                        onClick={() => handleRespond(alert._id, 'declined')}
                        className="text-gray-400 hover:text-sos-red font-bold px-3 py-1.5 rounded-xl text-xxs flex items-center justify-center space-x-1 transition duration-155"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Dismiss Alert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Timeline of responses */}
          <div className="lg:col-span-4 space-y-6 bg-white rounded-3xl p-6 shadow-xs border border-soft-border">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest pb-3 border-b border-soft-border flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Response Mission Log</span>
            </h2>

            <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
              {historyAlerts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-2xl opacity-50 block">🪵</span>
                  <p className="text-[10px] text-gray-400 italic">No past response missions logged.</p>
                </div>
              ) : (
                <div className="relative border-l border-soft-border pl-4 space-y-6">
                  {historyAlerts.map((hAlert) => (
                    <div key={hAlert._id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-white ${
                        hAlert.myResponseStatus === 'accepted' ? 'border-trust-teal' : 'border-sos-red'
                      }`}></span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-ink-dark text-xs leading-tight">
                            {hAlert.hospitalName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              hAlert.myResponseStatus === 'accepted'
                                ? 'bg-trust-teal/10 text-trust-teal border border-trust-teal/20'
                                : 'bg-sos-red/10 text-sos-red border border-sos-red/20'
                            }`}
                          >
                            {hAlert.myResponseStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Blood Request: <strong className="text-gray-700">{hAlert.bloodGroupNeeded}</strong>
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono font-semibold">
                          Date: {new Date(hAlert.createdAt).toLocaleDateString()}
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
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-soft-border max-w-4xl mx-auto space-y-8">
          <div className="space-y-2 border-b border-soft-border pb-4">
            <h2 className="text-xl font-black text-ink-dark font-display">Blood Compatibility Matrix</h2>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Check matching coordinates compatibility requirements for donor and recipient profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Can Donate To card */}
            <div className="bg-clinical-bg/50 p-6 rounded-2xl border border-soft-border space-y-4">
              <div className="flex items-center space-x-2 text-brand-red">
                <Heart className="h-5 w-5 fill-current" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-ink-dark">You Can Donate To</h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {compatibility.donate.map((group) => (
                  <span key={group} className="wristband-badge font-black text-xs py-2.5 px-4 shadow-sm border border-soft-border text-ink-dark">
                    {group}
                  </span>
                ))}
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed pt-2 font-medium">
                {user?.bloodGroup === 'O-' ? (
                  <strong>Universal Donor:</strong> + "Your red blood cells can be transfused to all patients, making it highly valuable in emergencies."
                ) : (
                  `As an ${user?.bloodGroup} donor, your red blood cells can be transfused safely to these groups.`
                )}
              </p>
            </div>

            {/* Can Receive From card */}
            <div className="bg-clinical-bg/50 p-6 rounded-2xl border border-soft-border space-y-4">
              <div className="flex items-center space-x-2 text-trust-teal">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-ink-dark">You Can Receive From</h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {compatibility.receive.map((group) => (
                  <span key={group} className="wristband-badge verified font-black text-xs py-2.5 px-4 shadow-sm border border-soft-border text-ink-dark">
                    {group}
                  </span>
                ))}
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed pt-2 font-medium">
                {user?.bloodGroup === 'AB+' ? (
                  <strong>Universal Recipient:</strong> + "You can safely receive red blood cells from any blood group type in an emergency."
                ) : (
                  `If you ever need blood, you can safely receive transfusions from these blood types.`
                )}
              </p>
            </div>
          </div>

          {/* Full Grid Chart */}
          <div className="border border-soft-border rounded-2xl p-6 bg-clinical-bg/30 space-y-4">
            <h4 className="text-xs font-bold text-ink-dark uppercase tracking-wider">General Grid Quick Reference</h4>
            <div className="overflow-x-auto text-[10px]">
              <table className="min-w-full text-center border-collapse text-gray-500">
                <thead>
                  <tr className="border-b border-soft-border">
                    <th className="py-2 font-extrabold text-left text-gray-400">Donor Type</th>
                    {BLOOD_GROUPS.map((bg) => (
                      <th key={bg} className="py-2 font-extrabold text-ink-dark">{bg}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-border">
                  {BLOOD_GROUPS.map((donorGroup) => (
                    <tr key={donorGroup} className="hover:bg-white/80">
                      <td className="py-2.5 font-bold text-left text-ink-dark">{donorGroup}</td>
                      {BLOOD_GROUPS.map((recGroup) => {
                        const canDonate = BLOOD_COMPATIBILITY[donorGroup].donate.includes(recGroup);
                        return (
                          <td key={recGroup} className="py-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded font-extrabold ${
                              canDonate ? 'bg-brand-red/5 text-brand-red' : 'text-gray-300'
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
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-soft-border max-w-4xl mx-auto space-y-8">
          <div className="space-y-2 border-b border-soft-border pb-4">
            <h2 className="text-xl font-black text-ink-dark font-display">Donation Guidelines</h2>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Making sure you are healthy and fully prepared simplifies the process and guarantees your donation goes smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Before */}
            <div className="p-6 border border-soft-border rounded-2xl space-y-4 hover:border-brand-red/30 transition bg-clinical-bg/10">
              <span className="bg-brand-red/5 text-brand-red px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider border border-brand-red/10">
                1. Before Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-600 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-brand-red">💧</span>
                  <span><strong>Stay Hydrated:</strong> Drink plenty of water or juice (approx. 500ml) right before.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-brand-red">🥗</span>
                  <span><strong>Eat Healthy:</strong> Eat a meal rich in iron. Avoid fatty foods which interfere with testing.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-brand-red">💤</span>
                  <span><strong>Rest Well:</strong> Sleep a full 7-8 hours the night prior.</span>
                </li>
              </ul>
            </div>

            {/* Step 2: During */}
            <div className="p-6 border border-soft-border rounded-2xl space-y-4 hover:border-brand-red/30 transition bg-clinical-bg/10">
              <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider border border-amber-200/50">
                2. During Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-600 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">🧘</span>
                  <span><strong>Relax:</strong> Wear comfortable sleeves. Take deep breaths or chat with the staff.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">⏱️</span>
                  <span><strong>Quick Process:</strong> The actual blood draw takes only 8 to 12 minutes.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-amber-500">🛡️</span>
                  <span><strong>Safe Equipment:</strong> Sterile, single-use needles are always used for your safety.</span>
                </li>
              </ul>
            </div>

            {/* Step 3: After */}
            <div className="p-6 border border-soft-border rounded-2xl space-y-4 hover:border-brand-red/30 transition bg-clinical-bg/10">
              <span className="bg-trust-teal/5 text-trust-teal px-3.5 py-1.5 rounded-xl text-xxs font-black uppercase tracking-wider border border-trust-teal/10">
                3. After Donation
              </span>
              <ul className="space-y-3 text-xs text-gray-650 pt-2 font-medium">
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-trust-teal">🥤</span>
                  <span><strong>Have Snacks:</strong> Rest for 10-15 minutes at the center and have the provided snacks.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-trust-teal">🏋️</span>
                  <span><strong>Limit Strain:</strong> Avoid heavy lifting or strenuous physical exercise for the next 5-6 hours.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-1.5 mt-0.5 text-trust-teal">📅</span>
                  <span><strong>Next Date:</strong> Wait 90 days (12 weeks) before your next whole blood contribution.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-soft-border mx-auto">
          <h2 className="text-xs font-black text-gray-400 border-b border-soft-border pb-3 mb-6 uppercase tracking-widest">
            Profile Coordination Settings
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
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
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
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
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
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
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
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-brand-red uppercase tracking-wider mb-1.5">
                  Blood Group
                </label>
                <select
                  required
                  value={profileData.bloodGroup}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                  className="block w-full px-3 py-2.5 border border-brand-red/20 bg-brand-red/5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red text-ink-dark"
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
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red bg-clinical-bg/30"
                />
              </div>
            </div>

            {profileData.lat && profileData.lng && (
              <div className="bg-trust-teal/5 text-trust-teal text-xxs font-black p-3.5 rounded-xl border border-trust-teal/15 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Map Pinpoint Coordinates Registered</span>
                </span>
                <span className="font-mono">
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

            <div className="pt-4 border-t border-soft-border">
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs tracking-wider uppercase shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
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
