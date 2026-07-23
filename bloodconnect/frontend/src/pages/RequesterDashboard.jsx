import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  AlertTriangle, 
  Plus, 
  Activity, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  HelpCircle, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  XCircle,
  Building2
} from 'lucide-react';
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
      fetchMyRequests(true);
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
    const baseClass = 'text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider';
    if (urgency === 'critical') return `${baseClass} bg-sos-red/10 text-sos-red animate-pulse`;
    if (urgency === 'medium') return `${baseClass} bg-amber-50 text-amber-800`;
    return `${baseClass} bg-clinical-bg text-gray-500 border border-soft-border`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-clinical-bg min-h-screen">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-ink-dark">
            Requester Coordination Dashboard
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Manage your emergency broadcasts, check donor response tracking, and accept blood bank offers.
          </p>
        </div>

        <Link
          to="/sos/new"
          className="bg-sos-red hover:bg-sos-red/95 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-sm transition duration-150 flex items-center justify-center space-x-1.5 transform hover:-translate-y-0.5 active:translate-y-0 self-stretch sm:self-auto text-center relative z-10"
        >
          <Plus className="h-4 w-4" />
          <span>New SOS Broadcast</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-soft-border shadow-xs">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
            <Activity className="h-4 w-4 text-brand-red" />
            <span>Emergency Broadcast Registry ({requests.length})</span>
          </h2>
          <button
            onClick={() => fetchMyRequests()}
            className="text-gray-405 hover:text-brand-red p-1.5 rounded-lg hover:bg-brand-red/5 transition duration-150"
            title="Refresh History"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-soft-border">
            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-soft-border text-center text-gray-400 space-y-4 max-w-2xl mx-auto shadow-xs">
            <div className="bg-sos-red/5 text-sos-red p-4 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto border border-sos-red/10">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-ink-dark text-sm">No Active SOS Broadcasts</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed font-medium">
                If you have a medical emergency, you can broadcast an SOS request to alert matching blood donors and institutions within your specified perimeter instantly.
              </p>
            </div>
            <Link
              to="/sos/new"
              className="inline-block bg-sos-red hover:bg-sos-red/95 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-xs transition duration-150"
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
              
              const isExpanded = expandedRequestId === req._id;

              return (
                <div
                  key={req._id}
                  className="bg-white rounded-3xl border border-soft-border hover:border-brand-red/20 shadow-xs overflow-hidden transition duration-150"
                >
                  {/* Summary Card Header */}
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="wristband-badge font-mono font-bold text-xs">
                          {req.bloodGroupNeeded} Required
                        </span>
                        {getUrgencyBadge(req.urgency)}
                        <span className="text-xxs text-gray-400 font-semibold font-mono flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(req.createdAt).toLocaleDateString()} •{' '}
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-ink-dark flex items-center space-x-1.5 font-display">
                        <MapPin className="h-4 w-4 text-brand-red" />
                        <span>{req.hospitalName}</span>
                      </h3>
                    </div>

                    {/* Stats overview */}
                    <div className="flex items-center space-x-6 w-full md:w-auto justify-between border-t md:border-t-0 border-soft-border pt-4 md:pt-0">
                      <div className="grid grid-cols-3 gap-6 text-center text-xs">
                        <div>
                          <p className="font-black text-trust-teal text-lg font-mono">{acceptedDonors.length}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Accepted</p>
                        </div>
                        <div>
                          <p className="font-black text-sos-red text-lg font-mono">{declinedDonors.length}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Declined</p>
                        </div>
                        <div>
                          <p className="font-black text-gray-400 text-lg font-mono">{pendingDonors.length}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Pending</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(req._id)}
                        className={`p-2.5 border border-soft-border rounded-xl hover:bg-brand-red/5 hover:text-brand-red transition flex items-center justify-center ${
                          isExpanded ? 'bg-brand-red/5 text-brand-red' : 'bg-clinical-bg text-gray-500'
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail drawer - lists responding donors */}
                  {isExpanded && (
                    <div className="border-t border-soft-border bg-clinical-bg/30 p-6 space-y-6">
                      
                      {/* Section 1: Donors */}
                      <div>
                        <h4 className="text-xxs font-black text-gray-400 mb-3 tracking-widest uppercase">
                          Donor Responses & Coordination ({req.respondedDonors.length} matches)
                        </h4>

                        {req.respondedDonors.length === 0 ? (
                          <p className="text-xxs text-gray-400 italic font-semibold">No matching donors were in the radius to receive this alert.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {req.respondedDonors.map((donorEntry) => {
                              const donor = donorEntry.donorId;
                              if (!donor) return null;

                              return (
                                <div
                                  key={donor._id}
                                  className="bg-white rounded-2xl p-4 border border-soft-border flex justify-between items-center shadow-xs"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="wristband-badge font-mono font-bold text-[10px] py-0.5 px-2">
                                        {donor.bloodGroup}
                                      </span>
                                      <span className="text-xs font-black text-ink-dark">{donor.name}</span>
                                    </div>
                                    <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                                      <span className="flex items-center space-x-1">
                                        <Phone className="h-3 w-3 text-gray-400 mr-0.5" />
                                        <a href={`tel:${donor.phone}`} className="hover:underline font-bold font-mono text-brand-red">{donor.phone}</a>
                                      </span>
                                      <span>Email: {donor.email}</span>
                                    </div>
                                  </div>

                                  <div>
                                    {donorEntry.status === 'accepted' && (
                                      <span className="bg-trust-teal/10 text-trust-teal text-xxs font-extrabold px-2.5 py-1 rounded-full border border-trust-teal/20 flex items-center space-x-0.5 uppercase tracking-wider">
                                        <CheckCircle className="h-3.5 w-3.5 mr-0.5" />
                                        <span>Accepted</span>
                                      </span>
                                    )}
                                    {donorEntry.status === 'declined' && (
                                      <span className="bg-sos-red/10 text-sos-red text-xxs font-extrabold px-2.5 py-1 rounded-full border border-sos-red/20 flex items-center space-x-0.5 uppercase tracking-wider">
                                        <XCircle className="h-3.5 w-3.5 mr-0.5" />
                                        <span>Declined</span>
                                      </span>
                                    )}
                                    {donorEntry.status === 'pending' && (
                                      <span className="bg-clinical-bg text-gray-400 text-xxs font-extrabold px-2.5 py-1 rounded-full border border-soft-border flex items-center space-x-0.5 uppercase tracking-wider animate-pulse">
                                        <Clock className="h-3.5 w-3.5 mr-0.5" />
                                        <span>Pending</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Blood Bank Offers */}
                      <div className="pt-6 border-t border-soft-border">
                        <h4 className="text-xxs font-black text-gray-400 mb-3 tracking-widest uppercase">
                          Blood Bank Stock Offers ({req.bankOffers?.length || 0} offers)
                        </h4>

                        {!req.bankOffers || req.bankOffers.length === 0 ? (
                          <p className="text-xxs text-gray-400 italic font-semibold">No blood banks have offered stock for this request yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {req.bankOffers.map((offer) => {
                              const bank = offer.bloodBankId;
                              if (!bank) return null;

                              return (
                                <div
                                  key={offer._id}
                                  className="bg-white rounded-2xl p-4 border border-soft-border flex flex-col justify-between shadow-xs space-y-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="bg-brand-red/10 text-brand-red p-1 rounded-lg">
                                          <Building2 className="h-4 w-4" />
                                        </span>
                                        <span className="text-xs font-black text-ink-dark">{bank.name}</span>
                                      </div>
                                      <div className="flex flex-col text-[10px] text-gray-500 mt-1 font-medium leading-relaxed">
                                        <span className="flex items-center space-x-1">
                                          <Phone className="h-3 w-3 text-gray-400 mr-0.5" />
                                          <a href={`tel:${bank.phone}`} className="hover:underline font-bold font-mono text-brand-red">{bank.phone}</a>
                                        </span>
                                        <span>Address: {bank.address}, {bank.city}</span>
                                      </div>
                                    </div>
                                    <span className="bg-brand-red/5 text-brand-red font-mono font-black text-[10px] px-2.5 py-1 rounded-lg border border-brand-red/10">
                                      Offered: {offer.unitsOffered} Units
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center pt-2.5 border-t border-soft-border">
                                    <div>
                                      {offer.status === 'accepted' && (
                                        <span className="bg-trust-teal/10 text-trust-teal text-xxs font-extrabold px-2.5 py-1 rounded-full border border-trust-teal/20 flex items-center space-x-0.5 uppercase tracking-wider">
                                          <CheckCircle className="h-3.5 w-3.5 mr-0.5" />
                                          <span>Accepted</span>
                                        </span>
                                      )}
                                      {offer.status === 'declined' && (
                                        <span className="bg-sos-red/10 text-sos-red text-xxs font-extrabold px-2.5 py-1 rounded-full border border-sos-red/20 flex items-center space-x-0.5 uppercase tracking-wider">
                                          <XCircle className="h-3.5 w-3.5 mr-0.5" />
                                          <span>Declined</span>
                                        </span>
                                      )}
                                      {offer.status === 'pending' && (
                                        <span className="bg-clinical-bg text-gray-400 text-xxs font-extrabold px-2.5 py-1 rounded-full border border-soft-border flex items-center space-x-0.5 uppercase tracking-wider animate-pulse">
                                          <Clock className="h-3.5 w-3.5 mr-0.5" />
                                          <span>Pending</span>
                                        </span>
                                      )}
                                    </div>

                                    {offer.status === 'pending' && (
                                      <div className="flex space-x-1.5">
                                        <button
                                          onClick={() => handleRespondToOffer(req._id, offer._id, 'declined')}
                                          className="bg-clinical-bg hover:bg-gray-150 text-gray-500 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-soft-border transition duration-150 uppercase tracking-wider"
                                        >
                                          Decline
                                        </button>
                                        <button
                                          onClick={() => handleRespondToOffer(req._id, offer._id, 'accepted')}
                                          className="bg-brand-red hover:bg-brand-red/95 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition duration-150 uppercase tracking-wider"
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
