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
  ChevronDown,
  ChevronUp,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Verification Status Warning Banner */}
      {!user?.isVerified && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Account Awaiting Verification</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Your blood bank is registered but not verified by the administrator yet. You can manage your inventory locally, but you will not appear in requester search queries or receive active emergency SOS alerts until verified.
            </p>
          </div>
        </div>
      )}

      {/* Low Stock General Warning Banner */}
      {user?.isVerified && lowStockGroups.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start space-x-3 shadow-sm animate-pulse">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Low Stock Alert!</h4>
            <p className="text-xs text-red-700 mt-0.5">
              The following blood groups have fallen below your low stock threshold ({lowStockThreshold} units):{' '}
              <span className="font-black">
                {lowStockGroups.map((g) => `${g.bloodGroup} (${g.units}u)`).join(', ')}
              </span>. Please arrange logs or walks to replenish levels.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-50/50 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-gray-900 flex items-center space-x-2">
            <span className="bg-red-600 text-white p-1.5 rounded-lg">
              <Building2 className="h-6 w-6" />
            </span>
            <span>{user?.name}</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium flex items-center">
            <MapPin className="h-3.5 w-3.5 text-red-500 mr-1" />
            <span>Licence: {user?.licenceNumber} • {user?.city}</span>
          </p>
        </div>

        <button
          onClick={() => {
            fetchProfileData();
            fetchDonations();
            fetchIncomingSOS();
          }}
          className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-250 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-150 flex items-center space-x-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap bg-gray-100 p-1 rounded-2xl border border-gray-200/60 max-w-xl">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition duration-150 ${
            activeTab === 'inventory' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Manage Stock
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition duration-150 ${
            activeTab === 'donations' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Log Donations
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
            activeTab === 'sos' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Incoming SOS</span>
          {incomingSOS.filter((s) => !s.myOfferStatus).length > 0 && (
            <span className="h-4 w-4 bg-red-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {incomingSOS.filter((s) => !s.myOfferStatus).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition duration-150 ${
            activeTab === 'profile' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Profile Details
        </button>
      </div>

      {/* View Content */}
      <div className="space-y-6">

        {/* 1. STOCK INVENTORY EDITOR */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-800">Live Blood Inventory Stock</h3>
                <p className="text-xs text-gray-500">View and adjust active unit levels. Rows in red are below the low stock warning threshold.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Blood Group</th>
                      <th className="px-6 py-4">Stock Status</th>
                      <th className="px-6 py-4 text-center">Available Units</th>
                      <th className="px-6 py-4 text-right">Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {BLOOD_GROUPS.map((bg) => {
                      const stockItem = inventory.find((item) => item.bloodGroup === bg) || { bloodGroup: bg, units: 0 };
                      const isLow = stockItem.units < lowStockThreshold;

                      return (
                        <tr key={bg} className={`hover:bg-gray-50/20 ${isLow ? 'bg-red-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="h-8 w-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-black text-xs">
                              {bg}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isLow ? (
                              <span className="bg-red-100 text-red-700 border border-red-200 text-xxs font-black px-2 py-0.5 rounded-full">
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="bg-green-50 text-green-700 border border-green-200 text-xxs font-bold px-2 py-0.5 rounded-full">
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
                              className="w-16 px-2 py-1 text-center font-bold border border-gray-250 rounded-lg focus:outline-none focus:border-red-600 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => handleUpdateStock(bg, stockItem.units, -1)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-black text-xs border border-gray-200"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleUpdateStock(bg, stockItem.units, 1)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-black text-xs shadow-xs"
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
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Inventory Alert Settings</h4>
                <div className="space-y-3">
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider">
                    Low Stock warning threshold (units)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                      className="block w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                  <p className="text-xxs text-gray-400 leading-normal">
                    When any blood group units fall below this number, the server will trigger a socket alert showing a low stock warning banner.
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
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center space-x-1.5">
                  <Plus className="h-5 w-5 text-red-600" />
                  <span>Log New Donation</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Increments inventory stock automatically upon submission.</p>
              </div>

              <form onSubmit={handleLogDonation} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Donor Email (Optional - Links Registered Donors)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="donor@example.com"
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Donor Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Blood Group *
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Units Logged *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={donationUnits}
                      onChange={(e) => setDonationUnits(parseInt(e.target.value) || 1)}
                      className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-md transition duration-150 text-center flex items-center justify-center space-x-1.5"
                >
                  <span>Submit Donation Record</span>
                </button>
              </form>
            </div>

            {/* History Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center space-x-1.5">
                    <History className="h-5 w-5 text-red-600" />
                    <span>Donation Logs History</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Audit trail of walk-in and scheduled blood acquisitions.</p>
                </div>
                <button
                  onClick={fetchDonations}
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition duration-150"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
                {loadingDonations ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : donationHistory.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 italic text-sm">
                    No donation logs recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Group</th>
                        <th className="px-6 py-4 text-center">Units</th>
                        <th className="px-6 py-4 text-right">Donor Connection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {donationHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/20">
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(item.donatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-red-100 text-red-600 font-extrabold px-2.5 py-0.5 rounded text-xs">
                              {item.bloodGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-800">
                            {item.units} units
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.donorId ? (
                              <div>
                                <p className="font-bold text-gray-900">{item.donorId.name}</p>
                                <p className="text-[10px] text-gray-400">{item.donorId.phone}</p>
                              </div>
                            ) : (
                              <span className="text-xxs text-gray-400 italic font-medium">Walk-in Donor</span>
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
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center space-x-1.5">
                  <Activity className="h-5 w-5 text-red-600" />
                  <span>Incoming Emergency SOS Alerts ({incomingSOS.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Real-time requests in your vicinity requiring blood groups currently in your stock.</p>
              </div>
              <button
                onClick={fetchIncomingSOS}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition duration-150"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {loadingSOS ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : incomingSOS.length === 0 ? (
                <div className="py-20 text-center text-gray-400 space-y-3 max-w-sm mx-auto">
                  <div className="bg-gray-100 text-gray-500 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold">No incoming emergency broadcasts.</p>
                  <p className="text-xxs text-gray-400 leading-normal">
                    When requesters within radius raise an SOS for blood groups you have in stock, they will appear here instantly.
                  </p>
                </div>
              ) : (
                incomingSOS.map((req) => (
                  <div key={req._id} className="p-6 hover:bg-gray-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-red-100 text-red-700 font-extrabold text-xs px-3 py-0.5 rounded">
                          Blood Needed: {req.bloodGroupNeeded}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            req.urgency === 'critical' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-orange-50 text-orange-600'
                          }`}
                        >
                          {req.urgency} Urgency
                        </span>
                        <span className="text-xxs text-gray-400">
                          Raised on: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{req.hospitalName}</span>
                      </h4>

                      <div className="flex flex-col space-y-0.5 text-xxs text-gray-500 font-medium">
                        <p>Requester: {req.requester?.name || 'Emergency Contact'}</p>
                        <p>Contact Phone: <a href={`tel:${req.contactPhone}`} className="text-red-600 hover:underline">{req.contactPhone}</a></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0">
                      {req.myOfferStatus ? (
                        <div className="text-right">
                          <span
                            className={`text-xxs font-extrabold px-3 py-1 rounded-full border ${
                              req.myOfferStatus === 'accepted'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : req.myOfferStatus === 'declined'
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            OFFERED: {req.myOfferUnits} UNITS ({req.myOfferStatus.toUpperCase()})
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
                            className="w-16 px-2.5 py-1.5 text-center border border-gray-250 rounded-xl text-xs focus:outline-none focus:border-red-600 bg-white font-bold"
                          />
                          <button
                            onClick={() => handleOfferStock(req._id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs"
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
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-800">Organization Settings</h3>
                <p className="text-xs text-gray-500">Update contact phone, licence registration, and address details.</p>
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
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                    className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                      className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
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
                      className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-600 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingProfile ? 'Saving Details...' : 'Save Profile Details'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800">Update Map Location Pins</h4>
                <p className="text-xs text-gray-500">Correct your geographic coordinates to display accurately on combined Leaflet maps.</p>
              </div>

              <div className="border border-gray-100 p-2 rounded-2xl">
                <MapPicker
                  initialLat={profileData.lat}
                  initialLng={profileData.lng}
                  onChange={handleLocationChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 pt-2">
                <div>Selected Latitude: <span className="font-bold text-gray-800">{profileData.lat}</span></div>
                <div>Selected Longitude: <span className="font-bold text-gray-800">{profileData.lng}</span></div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BloodBankDashboard;
