import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AlertTriangle, Plus, Activity, Clock, User, Phone, CheckCircle, HelpCircle, MapPin, Eye, ChevronDown, ChevronUp, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RequesterDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  useEffect(() => {
    fetchMyRequests();

    // Listen to real-time response triggers to refresh the list
    const handleResponseUpdate = (e) => {
      console.log('Real-time response update received, refreshing requester list:', e.detail);
      fetchMyRequests();
    };

    window.addEventListener('sos:response_received', handleResponseUpdate);
    return () => {
      window.removeEventListener('sos:response_received', handleResponseUpdate);
    };
  }, []);

  const fetchMyRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/sos/my-requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load SOS request history');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRespondToOffer = async (sosRequestId, offerId, status) => {
    try {
      const res = await api.put(`/sos/${sosRequestId}/bank-offer/${offerId}/respond`, { status });
      if (res.data.success) {
        toast.success(`Successfully ${status} the stock offer!`);
        fetchMyRequests(true); // refresh silently
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to respond to stock offer.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedRequestId((prev) => (prev === id ? null : id));
  };

  const getUrgencyBadge = (urgency) => {
    const baseClass = 'text-xxs font-bold px-2 py-0.5 rounded uppercase';
    if (urgency === 'critical') return `${baseClass} bg-red-100 text-red-700 animate-pulse`;
    if (urgency === 'medium') return `${baseClass} bg-orange-100 text-orange-700`;
    return `${baseClass} bg-blue-100 text-blue-700`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-50/50 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-gray-900">
            Requester Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage your emergency broadcasts, check donor response tracking, and coordinate assistance.
          </p>
        </div>

        <Link
          to="/sos/new"
          className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition duration-150 flex items-center space-x-1.5 transform hover:-translate-y-0.5 active:translate-y-0 self-stretch sm:self-auto text-center justify-center relative z-10"
        >
          <Plus className="h-5 w-5" />
          <span>New SOS Request</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-red-600" />
            <span>Your Emergency SOS Requests ({requests.length})</span>
          </h2>
          <button
            onClick={() => fetchMyRequests()}
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition duration-150"
            title="Refresh History"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-150 text-center text-gray-400 space-y-4 max-w-2xl mx-auto">
            <div className="bg-red-50 text-red-600 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-gray-700 text-base">No active SOS requests</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                If you have a medical emergency, you can broadcast an SOS request to alert all matching blood donors within a 10km radius instantly.
              </p>
            </div>
            <Link
              to="/sos/new"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-150"
            >
              Broadcast SOS Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const acceptedDonors = req.respondedDonors.filter((d) => d.status === 'accepted');
              const declinedDonors = req.respondedDonors.filter((d) => d.status === 'declined');
              const pendingDonors = req.respondedDonors.filter((d) => d.status === 'pending');
              const totalTargeted = req.respondedDonors.length;
              
              const isExpanded = expandedRequestId === req._id;

              return (
                <div
                  key={req._id}
                  className="bg-white rounded-3xl border border-gray-150 hover:border-gray-200 shadow-sm overflow-hidden transition duration-150"
                >
                  {/* Summary Card Header */}
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-red-100 text-red-700 font-extrabold text-xs px-3 py-1 rounded-lg">
                          Blood Group: {req.bloodGroupNeeded}
                        </span>
                        {getUrgencyBadge(req.urgency)}
                        <span className="text-xxs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-0.5" />
                          {new Date(req.createdAt).toLocaleDateString()} at{' '}
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-800 flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{req.hospitalName}</span>
                      </h3>
                    </div>

                    {/* Stats overview */}
                    <div className="flex items-center space-x-6 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="grid grid-cols-3 gap-6 text-center text-xs">
                        <div>
                          <p className="font-black text-green-600 text-lg">{acceptedDonors.length}</p>
                          <p className="text-xxs text-gray-400 font-medium">Accepted</p>
                        </div>
                        <div>
                          <p className="font-black text-red-500 text-lg">{declinedDonors.length}</p>
                          <p className="text-xxs text-gray-400 font-medium">Declined</p>
                        </div>
                        <div>
                          <p className="font-black text-gray-500 text-lg">{pendingDonors.length}</p>
                          <p className="text-xxs text-gray-400 font-medium">Pending</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(req._id)}
                        className={`p-2 border border-gray-200 rounded-xl hover:bg-red-50/50 hover:text-red-600 transition flex items-center justify-center ${
                          isExpanded ? 'bg-red-50/30 text-red-600' : 'bg-white text-gray-500'
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail drawer - lists responding donors */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30 p-6 animate-enter">
                      <h4 className="text-xs font-bold text-gray-700 mb-4 tracking-wider uppercase">
                        Donor Responses & Coordination ({req.respondedDonors.length} matches)
                      </h4>

                      {req.respondedDonors.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No matching donors were in the radius to receive this alert.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {req.respondedDonors.map((donorEntry) => {
                            const donor = donorEntry.donorId;
                            if (!donor) return null;

                            return (
                              <div
                                key={donor._id}
                                className="bg-white rounded-2xl p-4 border border-gray-150 flex justify-between items-center shadow-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="h-5 w-5 rounded-full bg-red-50 text-red-600 font-bold text-[10px] flex items-center justify-center">
                                      {donor.bloodGroup}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800">{donor.name}</span>
                                  </div>
                                  <div className="flex flex-col text-[10px] text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3 text-gray-400 mr-0.5" />
                                      <a href={`tel:${donor.phone}`} className="hover:underline">{donor.phone}</a>
                                    </span>
                                    <span>Email: {donor.email}</span>
                                  </div>
                                </div>

                                <div>
                                  {donorEntry.status === 'accepted' && (
                                    <span className="bg-green-100 text-green-700 text-xxs font-extrabold px-2.5 py-1 rounded-full border border-green-200 flex items-center space-x-0.5">
                                      <CheckCircle className="h-3 w-3 mr-0.5" />
                                      <span>Accepted</span>
                                    </span>
                                  )}
                                  {donorEntry.status === 'declined' && (
                                    <span className="bg-red-50 text-red-600 text-xxs font-bold px-2.5 py-1 rounded-full border border-red-100 flex items-center space-x-0.5">
                                      <XCircle className="h-3 w-3 mr-0.5" />
                                      <span>Declined</span>
                                    </span>
                                  )}
                                  {donorEntry.status === 'pending' && (
                                    <span className="bg-gray-100 text-gray-500 text-xxs font-medium px-2.5 py-1 rounded-full border border-gray-200 flex items-center space-x-0.5 animate-pulse">
                                      <Clock className="h-3 w-3 mr-0.5" />
                                      <span>Pending</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <h4 className="text-xs font-bold text-gray-700 mt-6 mb-4 tracking-wider uppercase">
                        Blood Bank Stock Offers ({req.bankOffers?.length || 0} offers)
                      </h4>

                      {!req.bankOffers || req.bankOffers.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No blood banks have offered stock for this request yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {req.bankOffers.map((offer) => {
                            const bank = offer.bloodBankId;
                            if (!bank) return null;

                            return (
                              <div
                                key={offer._id}
                                className="bg-white rounded-2xl p-4 border border-gray-150 flex flex-col justify-between shadow-xs space-y-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="h-5 w-5 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center">
                                        🏦
                                      </span>
                                      <span className="text-xs font-bold text-gray-800">{bank.name}</span>
                                    </div>
                                    <div className="flex flex-col text-[10px] text-gray-500 mt-1">
                                      <span className="flex items-center space-x-1">
                                        <Phone className="h-3 w-3 text-gray-400 mr-0.5" />
                                        <a href={`tel:${bank.phone}`} className="hover:underline">{bank.phone}</a>
                                      </span>
                                      <span>Address: {bank.address}, {bank.city}</span>
                                    </div>
                                  </div>
                                  <span className="bg-red-50 text-red-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-red-150">
                                    Offered: {offer.unitsOffered} units
                                  </span>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-150">
                                  <div>
                                    {offer.status === 'accepted' && (
                                      <span className="bg-green-100 text-green-700 text-xxs font-extrabold px-2.5 py-1 rounded-full border border-green-200 flex items-center space-x-0.5">
                                        <CheckCircle className="h-3 w-3 mr-0.5" />
                                        <span>Accepted</span>
                                      </span>
                                    )}
                                    {offer.status === 'declined' && (
                                      <span className="bg-red-50 text-red-600 text-xxs font-bold px-2.5 py-1 rounded-full border border-red-100 flex items-center space-x-0.5">
                                        <XCircle className="h-3 w-3 mr-0.5" />
                                        <span>Declined</span>
                                      </span>
                                    )}
                                    {offer.status === 'pending' && (
                                      <span className="bg-gray-100 text-gray-500 text-xxs font-medium px-2.5 py-1 rounded-full border border-gray-200 flex items-center space-x-0.5 animate-pulse">
                                        <Clock className="h-3 w-3 mr-0.5" />
                                        <span>Pending</span>
                                      </span>
                                    )}
                                  </div>

                                  {offer.status === 'pending' && (
                                    <div className="flex space-x-1.5">
                                      <button
                                        onClick={() => handleRespondToOffer(req._id, offer._id, 'declined')}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] border border-gray-250 transition duration-150"
                                      >
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => handleRespondToOffer(req._id, offer._id, 'accepted')}
                                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] shadow-xs transition duration-150"
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequesterDashboard;
