import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Users, Heart, AlertTriangle, ShieldCheck, Trash2, CheckCircle2, XCircle, Search, RefreshCw, Layers, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [donors, setDonors] = useState([]);
  const [requesters, setRequesters] = useState([]);
  const [sosRequests, setSOSRequests] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('donors'); // 'donors', 'requesters', 'sos', or 'bloodbanks'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donorsRes, requestersRes, sosRes, banksRes] = await Promise.all([
        api.get('/admin/donors'),
        api.get('/admin/requesters'),
        api.get('/admin/sos'),
        api.get('/admin/bloodbanks'),
      ]);

      if (donorsRes.data.success) {
        setDonors(donorsRes.data.data);
      }
      if (requestersRes.data.success) {
        setRequesters(requestersRes.data.data);
      }
      if (sosRes.data.success) {
        setSOSRequests(sosRes.data.data);
      }
      if (banksRes.data.success) {
        setBloodBanks(banksRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load administration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (donorId, currentStatus) => {
    try {
      const res = await api.put(`/admin/donors/${donorId}/verify`, { isVerified: !currentStatus });
      if (res.data.success) {
        setDonors((prev) =>
          prev.map((d) => (d._id === donorId ? { ...d, isVerified: !currentStatus } : d))
        );
        toast.success(`Verification status updated!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update verification status');
    }
  };

  const handleRequesterVerifyToggle = async (requesterId, currentStatus) => {
    try {
      const res = await api.put(`/admin/requesters/${requesterId}/verify`, { isVerified: !currentStatus });
      if (res.data.success) {
        setRequesters((prev) =>
          prev.map((r) => (r._id === requesterId ? { ...r, isVerified: !currentStatus } : r))
        );
        toast.success(`Verification status updated!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update verification status');
    }
  };

  const handleBankVerifyToggle = async (bankId, currentStatus) => {
    try {
      const res = await api.put(`/admin/bloodbanks/${bankId}/verify`, { isVerified: !currentStatus });
      if (res.data.success) {
        setBloodBanks((prev) =>
          prev.map((b) => (b._id === bankId ? { ...b, isVerified: !currentStatus } : b))
        );
        toast.success(`Blood bank verification status updated!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update blood bank verification status');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/donors/${userId}`);
      if (res.data.success) {
        setDonors((prev) => prev.filter((d) => d._id !== userId));
        setRequesters((prev) => prev.filter((r) => r._id !== userId));
        toast.success(`User "${name}" has been deleted.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user account');
    }
  };

  const handleDeleteBank = async (bankId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete blood bank "${name}"? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/bloodbanks/${bankId}`);
      if (res.data.success) {
        setBloodBanks((prev) => prev.filter((b) => b._id !== bankId));
        toast.success(`Blood Bank "${name}" has been deleted.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete blood bank account');
    }
  };

  // Filter lists based on search
  const filteredDonors = donors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequesters = requesters.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSOS = sosRequests.filter(
    (r) =>
      r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bloodGroupNeeded.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.urgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requesterId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBloodBanks = bloodBanks.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.licenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics calculation
  const totalVerifiedDonors = donors.filter((d) => d.isVerified).length;
  const totalVerifiedRequesters = requesters.filter((r) => r.isVerified).length;
  const activeSOSCount = sosRequests.filter((r) => r.status === 'pending').length;
  const totalVerifiedBanks = bloodBanks.filter((b) => b.isVerified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-50/50 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-gray-900 flex items-center space-x-2">
            <span className="bg-red-600 text-white p-1.5 rounded-lg">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            System administration console. Verify donor credentials, audit emergency alerts, and moderate account activities.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-250 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-150 flex items-center space-x-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Metrics</span>
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex items-center space-x-4">
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{donors.length}</p>
            <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Registered Donors ({totalVerifiedDonors} Verified)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex items-center space-x-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{requesters.length}</p>
            <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Registered Requesters ({totalVerifiedRequesters} Verified)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex items-center space-x-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-2xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{activeSOSCount}</p>
            <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Active SOS Alerts</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex items-center space-x-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{bloodBanks.length}</p>
            <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Blood Banks ({totalVerifiedBanks} Verified)</p>
          </div>
        </div>
      </div>

      {/* Control Switch & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-200 pb-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/60 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('donors'); setSearchTerm(''); }}
            className={`flex-1 md:flex-none py-2 px-6 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === 'donors' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Donors
          </button>
          <button
            onClick={() => { setActiveTab('requesters'); setSearchTerm(''); }}
            className={`flex-1 md:flex-none py-2 px-6 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === 'requesters' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Requesters
          </button>
          <button
            onClick={() => { setActiveTab('sos'); setSearchTerm(''); }}
            className={`flex-1 md:flex-none py-2 px-6 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === 'sos' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            SOS History
          </button>
          <button
            onClick={() => { setActiveTab('bloodbanks'); setSearchTerm(''); }}
            className={`flex-1 md:flex-none py-2 px-6 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === 'bloodbanks' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Blood Banks
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={
              activeTab === 'donors'
                ? 'Search by name, city, email...'
                : activeTab === 'requesters'
                ? 'Search by name, city, email...'
                : activeTab === 'bloodbanks'
                ? 'Search by name, city, licence...'
                : 'Search by hospital, requester, priority...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 border border-gray-250 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
          />
        </div>
      </div>

      {/* Main lists rendering */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'donors' ? (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Donor Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Blood Group</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Verified Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400 italic bg-white">
                      No matching donor accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map((donor) => (
                    <tr key={donor._id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 flex items-center">
                          <span>{donor.name}</span>
                          {donor.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-green-600 fill-green-50 ml-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">ID: {donor._id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{donor.email}</p>
                        <p className="text-[10px] text-gray-500">Tel: {donor.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-red-100 text-red-600 font-extrabold px-2 py-0.5 rounded text-xs">
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{donor.city}</p>
                        <p className="text-[10px] text-gray-500">Pincode: {donor.pincode}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleVerifyToggle(donor._id, donor.isVerified)}
                          className={`inline-block font-extrabold text-[10px] px-3 py-1 rounded-full border transition duration-150 ${
                            donor.isVerified
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-250 hover:bg-gray-150'
                          }`}
                        >
                          {donor.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(donor._id, donor.name)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition duration-150"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'sos' ? (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Hospital & Location</th>
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Blood Required</th>
                  <th className="px-6 py-4 text-center">Priority</th>
                  <th className="px-6 py-4 text-center">Responses</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Requested On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredSOS.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400 italic bg-white">
                      No matching emergency SOS requests found.
                    </td>
                  </tr>
                ) : (
                  filteredSOS.map((req) => {
                    const acceptedCount = req.respondedDonors.filter((d) => d.status === 'accepted').length;
                    const totalMatches = req.respondedDonors.length;

                    return (
                      <tr key={req._id} className="hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{req.hospitalName}</p>
                          <p className="text-[10px] text-gray-400">
                            Coords: [{req.location?.coordinates[0]?.toFixed(4)}, {req.location?.coordinates[1]?.toFixed(4)}]
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{req.requesterId?.name || 'Unknown User'}</p>
                          <p className="text-[10px] text-gray-500">Contact: {req.contactPhone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-red-100 text-red-600 font-extrabold px-2.5 py-1 rounded text-xs">
                            {req.bloodGroupNeeded}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              req.urgency === 'critical'
                                ? 'bg-red-50 text-red-600'
                                : req.urgency === 'medium'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-800">
                          {acceptedCount} / {totalMatches} Accepted
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              req.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : req.status === 'fulfilled'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}<br />
                          <span className="text-[10px] text-gray-400">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'requesters' ? (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Requester Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Verified Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredRequesters.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400 italic bg-white">
                      No matching requester accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredRequesters.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 flex items-center">
                          <span>{req.name}</span>
                          {req.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-green-600 fill-green-50 ml-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">ID: {req._id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{req.email}</p>
                        <p className="text-[10px] text-gray-500">Tel: {req.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{req.city}</p>
                        <p className="text-[10px] text-gray-500">Pincode: {req.pincode}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRequesterVerifyToggle(req._id, req.isVerified)}
                          className={`inline-block font-extrabold text-[10px] px-3 py-1 rounded-full border transition duration-150 ${
                            req.isVerified
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-250 hover:bg-gray-150'
                          }`}
                        >
                          {req.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(req._id, req.name)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition duration-150"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Blood Bank Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Licence Number</th>
                  <th className="px-6 py-4">Address / City</th>
                  <th className="px-6 py-4 text-center">Verified Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredBloodBanks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400 italic bg-white">
                      No matching blood bank accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredBloodBanks.map((bank) => (
                    <tr key={bank._id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 flex items-center">
                          <span>{bank.name}</span>
                          {bank.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-green-600 fill-green-50 ml-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">ID: {bank._id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{bank.email}</p>
                        <p className="text-[10px] text-gray-500">Tel: {bank.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-red-800 text-white font-extrabold px-2 py-0.5 rounded text-[10px]">
                          {bank.licenceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{bank.address}</p>
                        <p className="text-[10px] text-gray-500">{bank.city}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleBankVerifyToggle(bank._id, bank.isVerified)}
                          className={`inline-block font-extrabold text-[10px] px-3 py-1 rounded-full border transition duration-150 ${
                            bank.isVerified
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-250 hover:bg-gray-150'
                          }`}
                        >
                          {bank.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteBank(bank._id, bank.name)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition duration-150"
                          title="Delete Bank"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
