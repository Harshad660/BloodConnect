import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import MapPicker from '../components/MapPicker';
import {
  Building2,
  AlertTriangle,
  Plus,
  History,
  Activity,
  User,
  ShieldAlert,
  MapPin,
  Save,
  Phone,
  RefreshCw,
  Sliders,
  Inbox,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodBankDashboard = () => {
  const { user, updateProfile } = useAuth();
  const { socket } = useSocket() || {};
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'donations', 'sos', 'profile'
  
  // Stock State
  const [inventory, setInventory] = useState(user?.inventory || []);
  const [lowStockThreshold, setLowStockThreshold] = useState(user?.lowStockThreshold || 5);
  
  // Donation Logging State
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('O+');
  const [donationUnits, setDonationUnits] = useState(1);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  
  // SOS State
  const [incomingSOS, setIncomingSOS] = useState([]);
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [offerUnitsMap, setOfferUnitsMap] = useState({}); // mapping of sosRequestId -> unitsToOffer

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    licenceNumber: user?.licenceNumber || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    lat: user?.location?.coordinates[1] || '',
    lng: user?.location?.coordinates[0] || '',
    lowStockThreshold: user?.lowStockThreshold || 5,
  });
  
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchIncomingSOS();

    // Listen to low stock warning events
    const handleLowStockWarning = (e) => {
      console.log('Stock warned:', e.detail);
      // Refresh inventory
      fetchProfileData();
    };

    // Listen to socket response events to reload lists
    const handleSOSResponseUpdate = () => {
      fetchIncomingSOS();
    };

    window.addEventListener('inventory:low_warning', handleLowStockWarning);
    window.addEventListener('sos:response_received', handleSOSResponseUpdate);

    return () => {
      window.removeEventListener('inventory:low_warning', handleLowStockWarning);
      window.removeEventListener('sos:response_received', handleSOSResponseUpdate);
    };
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/bloodbank/me');
      if (res.data.success) {
        setInventory(res.data.user.inventory);
        setLowStockThreshold(res.data.user.lowStockThreshold);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const res = await api.get('/bloodbank/me/donations');
      if (res.data.success) {
        setDonationHistory(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load donation logs.');
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchIncomingSOS = async () => {
    setLoadingSOS(true);
    try {
      const res = await api.get('/sos/bank-incoming');
      if (res.data.success) {
        setIncomingSOS(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load incoming emergency requests.');
    } finally {
      setLoadingSOS(false);
    }
  };

  // Inventory logic
  const handleUpdateStock = async (bloodGroup, currentUnits, change) => {
    const newUnits = Math.max(0, currentUnits + change);
    try {
      const res = await api.put('/bloodbank/me/inventory', { bloodGroup, units: newUnits });
      if (res.data.success) {
        setInventory(res.data.inventory);
        toast.success(`${bloodGroup} stock updated to ${newUnits} units`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock');
    }
  };

  const handleDirectStockChange = async (bloodGroup, value) => {
    const val = parseInt(value);
    if (isNaN(val) || val < 0) return;
    try {
      const res = await api.put('/bloodbank/me/inventory', { bloodGroup, units: val });
      if (res.data.success) {
        setInventory(res.data.inventory);
        toast.success(`${bloodGroup} stock set to ${val} units`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to set stock');
    }
  };

  // Donation Logger
  const handleLogDonation = async (e) => {
    e.preventDefault();

    if (donationUnits <= 0) {
      toast.error('Please specify a positive unit count');
      return;
    }

    try {
      const res = await api.post('/bloodbank/me/donations', {
        donorEmail,
        donorPhone,
        bloodGroup: selectedGroup,
        units: donationUnits,
      });

      if (res.data.success) {
        toast.success('Donation logged successfully!');
        setDonorEmail('');
        setDonorPhone('');
        setDonationUnits(1);
        setInventory(res.data.inventory);
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to record donation.');
    }
  };

  // SOS offer units stock
  const handleOfferStock = async (sosRequestId) => {
    const units = offerUnitsMap[sosRequestId];
    if (!units || parseInt(units) <= 0) {
      toast.error('Please specify a valid unit quantity to offer');
      return;
    }

    try {
      const res = await api.put(`/sos/${sosRequestId}/bank-offer`, {
        unitsOffered: parseInt(units)
      });
      if (res.data.success) {
        toast.success('Stock offer submitted to requester!');
        // Refresh local details
        fetchIncomingSOS();
        fetchProfileData(); // stock gets held/decremented on acceptance, but good to fetch
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit offer.');
    }
  };

  // Profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await updateProfile(profileData);
      if (res.success) {
        toast.success('Organization profile updated!');
        fetchProfileData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Check if any blood group in inventory is low stock
  const lowStockGroups = inventory.filter((item) => item.units < lowStockThreshold);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-clinical-bg min-h-screen">
      
      {/* Verification Status Warning Banner */}
      {!user?.isVerified && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start space-x-3 shadow-xs animate-pulse">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm text-ink-dark">Organization Awaiting Verification</h4>
            <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
              Your blood bank is registered but not verified by the administrator yet. You can manage your inventory locally, but you will not appear in requester search queries or receive active emergency SOS alerts until verified.
            </p>
          </div>
        </div>
      )}

      {/* Low Stock General Warning Banner */}
      {user?.isVerified && lowStockGroups.length > 0 && (
        <div className="bg-sos-red/10 border border-sos-red/25 text-sos-red p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-sos-red flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-sm text-ink-dark">Low Stock Alert</h4>
            <p className="text-xs text-sos-red mt-1 font-semibold leading-relaxed">
              The following blood groups have fallen below your low stock threshold ({lowStockThreshold} units):{' '}
              <span className="font-mono font-black text-gray-800">
                {lowStockGroups.map((g) => `${g.bloodGroup} (${g.units}u)`).join(', ')}
              </span>. Please arrange logs or walks to replenish levels.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-ink-dark flex items-center space-x-2.5">
            <span className="bg-brand-red/15 text-brand-red p-2 rounded-xl">
              <Building2 className="h-6 w-6" />
            </span>
            <span>{user?.name}</span>
          </h1>
          <p className="text-xs text-gray-400 font-semibold flex items-center">
            <MapPin className="h-3.5 w-3.5 text-brand-red mr-1" />
            <span>Licence: {user?.licenceNumber} • {user?.city}</span>
          </p>
        </div>

        <button
          onClick={() => {
            fetchProfileData();
            fetchDonations();
            fetchIncomingSOS();
          }}
          className="bg-clinical-bg hover:bg-gray-100 text-ink-dark border border-soft-border font-bold px-4 py-2.5 rounded-xl text-xs transition duration-150 flex items-center space-x-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap bg-white/70 p-1 rounded-2xl border border-soft-border max-w-xl">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 px-4 text-xxs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 ${
            activeTab === 'inventory' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
          }`}
        >
          Manage Stock
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`flex-1 py-2.5 px-4 text-xxs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 ${
            activeTab === 'donations' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
          }`}
        >
          Log Donations
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          className={`flex-1 py-2.5 px-4 text-xxs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
            activeTab === 'sos' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
          }`}
        >
          <span>Incoming SOS</span>
          {incomingSOS.filter((s) => !s.myOfferStatus).length > 0 && (
            <span className="h-4 w-4 bg-sos-red text-white rounded-full text-[9px] flex items-center justify-center font-bold font-mono animate-pulse">
              {incomingSOS.filter((s) => !s.myOfferStatus).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-4 text-xxs uppercase tracking-wider font-extrabold rounded-xl transition duration-150 ${
            activeTab === 'profile' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
          }`}
        >
          Organization profile
        </button>
      </div>

      {/* View Content */}
      <div className="space-y-6">

        {/* 1. STOCK INVENTORY EDITOR */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-soft-border shadow-xs overflow-hidden">
              <div className="p-6 border-b border-soft-border">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Blood Inventory Stock</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">View and adjust active unit levels. Rows highlighted in red are currently below the safety threshold.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-clinical-bg/50 border-b border-soft-border text-xxs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Blood Group</th>
                      <th className="px-6 py-4">Stock Status</th>
                      <th className="px-6 py-4 text-center">Available Units</th>
                      <th className="px-6 py-4 text-right">Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-soft-border text-xs">
                    {BLOOD_GROUPS.map((bg) => {
                      const stockItem = inventory.find((item) => item.bloodGroup === bg) || { bloodGroup: bg, units: 0 };
                      const isLow = stockItem.units < lowStockThreshold;

                      return (
                        <tr key={bg} className={`hover:bg-clinical-bg/25 ${isLow ? 'bg-sos-red/5' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="wristband-badge font-black text-xs font-mono py-1 px-3">
                              {bg}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isLow ? (
                              <span className="bg-sos-red/10 text-sos-red border border-sos-red/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="bg-trust-teal/10 text-trust-teal border border-trust-teal/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                ADEQUATE
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={stockItem.units}
                              onChange={(e) => handleDirectStockChange(bg, e.target.value)}
                              className="w-16 px-2.5 py-1 text-center font-bold border border-soft-border rounded-lg focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-sm font-mono"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => handleUpdateStock(bg, stockItem.units, -1)}
                                className="bg-clinical-bg hover:bg-gray-200 text-ink-dark px-3 py-1.5 rounded-lg font-black text-xs border border-soft-border font-mono transition duration-100"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleUpdateStock(bg, stockItem.units, 1)}
                                className="bg-brand-red hover:bg-brand-red/95 text-white px-3 py-1.5 rounded-lg font-black text-xs font-mono shadow-xs transition duration-100"
                              >
                                +1
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-soft-border shadow-xs space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Inventory Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5">
                      Low Stock warning threshold (units)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                        className="block w-24 px-3 py-2 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 font-bold font-mono"
                      />
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.put('/bloodbank/me', { lowStockThreshold });
                            if (res.data.success) {
                              toast.success('Low stock warning threshold updated!');
                              fetchProfileData();
                            }
                          } catch (err) {
                            toast.error('Failed to update settings');
                          }
                        }}
                        className="bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xxs text-gray-450 leading-relaxed font-medium">
                    When stock levels drop below this limit, active alerts are raised, warning bank coordinators to coordinate walks or records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DONATION LOGGING FORM & HISTORY */}
        {activeTab === 'donations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-soft-border shadow-xs space-y-5">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-brand-red" />
                  <span>Log New Donation</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Increments active inventory stock automatically upon submission.</p>
              </div>

              <form onSubmit={handleLogDonation} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-555 mb-1.5">
                    Donor Email (Optional - Links Registered Donors)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="donor@example.com"
                    className="block w-full px-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 transition duration-150"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-555 mb-1.5">
                    Donor Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="block w-full px-3.5 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 transition duration-150"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-555 mb-1.5">
                      Blood Group *
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-white text-ink-dark font-bold font-mono"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-555 mb-1.5">
                      Units Logged *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={donationUnits}
                      onChange={(e) => setDonationUnits(parseInt(e.target.value) || 1)}
                      className="block w-full px-3 py-2 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-red hover:bg-brand-red/95 text-white font-extrabold py-3 px-4 rounded-xl text-xs tracking-wider uppercase shadow-xs transition duration-150 flex items-center justify-center space-x-1.5"
                >
                  <span>Submit Donation Record</span>
                </button>
              </form>
            </div>

            {/* History Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-soft-border shadow-xs overflow-hidden">
              <div className="p-6 border-b border-soft-border flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                    <History className="h-5 w-5 text-brand-red" />
                    <span>Donation Logs History</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Audit trail of walk-in and scheduled blood acquisitions.</p>
                </div>
                <button
                  onClick={fetchDonations}
                  className="text-gray-405 hover:text-brand-red p-1.5 rounded-lg hover:bg-brand-red/5 transition duration-150"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
                {loadingDonations ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : donationHistory.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 italic text-xs font-semibold">
                    No donation logs recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-clinical-bg/50 border-b border-soft-border text-xxs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Group</th>
                        <th className="px-6 py-4 text-center">Units</th>
                        <th className="px-6 py-4 text-right">Donor Connection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-border text-xs">
                      {donationHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-clinical-bg/25">
                          <td className="px-6 py-4 text-gray-500 font-mono">
                            {new Date(item.donatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="wristband-badge font-mono font-bold text-xs py-0.5 px-2">
                              {item.bloodGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-ink-dark font-mono">
                            {item.units} units
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {item.donorId ? (
                              <div>
                                <p className="font-extrabold text-ink-dark">{item.donorId.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{item.donorId.phone}</p>
                              </div>
                            ) : (
                              <span className="text-xxs text-gray-400 italic font-semibold">Walk-in Donor</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. INCOMING EMERGENCY SOS BROADCASTS */}
        {activeTab === 'sos' && (
          <div className="bg-white rounded-3xl border border-soft-border shadow-xs overflow-hidden">
            <div className="p-6 border-b border-soft-border flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-brand-red" />
                  <span>Incoming Emergency SOS Alerts ({incomingSOS.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Real-time requests in your vicinity matching blood groups currently in your stock.</p>
              </div>
              <button
                onClick={fetchIncomingSOS}
                className="text-gray-405 hover:text-brand-red p-1.5 rounded-lg hover:bg-brand-red/5 transition duration-150"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-soft-border">
              {loadingSOS ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : incomingSOS.length === 0 ? (
                <div className="py-20 text-center text-gray-450 space-y-3 max-w-sm mx-auto">
                  <div className="bg-clinical-bg/50 border border-soft-border text-gray-450 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-extrabold uppercase tracking-wide">No active broadcasts</p>
                  <p className="text-xxs text-gray-400 leading-relaxed font-medium">
                    When requesters within radius trigger an SOS matching groups you have in stock, they appear here instantly.
                  </p>
                </div>
              ) : (
                incomingSOS.map((req) => (
                  <div key={req._id} className="p-6 hover:bg-clinical-bg/25 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="wristband-badge font-mono font-bold text-xs">
                          {req.bloodGroupNeeded} Needed
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                            req.urgency === 'critical' ? 'bg-sos-red/10 text-sos-red animate-pulse' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {req.urgency} Urgency
                        </span>
                        <span className="text-xxs text-gray-450 font-semibold font-mono">
                          Date: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-ink-dark flex items-center space-x-1.5">
                        <MapPin className="h-4 w-4 text-brand-red" />
                        <span>{req.hospitalName}</span>
                      </h4>

                      <div className="flex flex-col space-y-0.5 text-xxs text-gray-500 font-medium">
                        <p>Requester: {req.requester?.name || 'Emergency Contact'}</p>
                        <p>Contact Phone: <a href={`tel:${req.contactPhone}`} className="text-brand-red hover:underline font-bold font-mono">{req.contactPhone}</a></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto justify-between border-t md:border-t-0 border-soft-border pt-4 md:pt-0">
                      {req.myOfferStatus ? (
                        <div className="text-right">
                          <span
                            className={`text-xxs font-extrabold px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                              req.myOfferStatus === 'accepted'
                                ? 'bg-trust-teal/10 text-trust-teal border-trust-teal/20'
                                : req.myOfferStatus === 'declined'
                                ? 'bg-sos-red/10 text-sos-red border-sos-red/20'
                                : 'bg-amber-50 text-amber-800 border-amber-200/50'
                            }`}
                          >
                            OFFERED: {req.myOfferUnits} UNITS ({req.myOfferStatus})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 w-full justify-end">
                          <input
                            type="number"
                            min="1"
                            placeholder="Units"
                            value={offerUnitsMap[req._id] || ''}
                            onChange={(e) =>
                              setOfferUnitsMap((prev) => ({
                                ...prev,
                                [req._id]: e.target.value,
                              }))
                            }
                            className="w-16 px-2.5 py-1.5 text-center border border-soft-border rounded-xl text-xs focus:outline-none focus:border-brand-red bg-white font-bold font-mono text-ink-dark"
                          />
                          <button
                            onClick={() => handleOfferStock(req._id)}
                            className="bg-brand-red hover:bg-brand-red/95 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-sm transition duration-100"
                          >
                            Offer Stock
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. PROFILE MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-soft-border shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization Settings</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Update contact phone, licence registration, and address details.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Blood Bank / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Licence / Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.licenceNumber}
                    onChange={(e) => setProfileData({ ...profileData, licenceNumber: e.target.value })}
                    className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Stock alert limit
                    </label>
                    <input
                      type="number"
                      required
                      value={profileData.lowStockThreshold}
                      onChange={(e) => setProfileData({ ...profileData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                      className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm focus:outline-none focus:border-brand-red bg-clinical-bg/30 text-ink-dark font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition duration-150 flex items-center justify-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingProfile ? 'Saving Details...' : 'Save Profile Details'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-soft-border shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Update Coordinates Anchor</h4>
                <p className="text-xs text-gray-500 mt-1 font-medium">Correct your geographic coordinates to display accurately on combined Leaflet maps.</p>
              </div>

              <div className="border border-soft-border p-2 rounded-2xl">
                <MapPicker
                  initialLat={profileData.lat}
                  initialLng={profileData.lng}
                  onChange={handleLocationChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-550 pt-2">
                <div>Selected Latitude: <span className="font-bold text-ink-dark font-mono">{profileData.lat}</span></div>
                <div>Selected Longitude: <span className="font-bold text-ink-dark font-mono">{profileData.lng}</span></div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BloodBankDashboard;
