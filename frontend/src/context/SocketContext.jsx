import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingSOSAlerts, setIncomingSOSAlerts] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    // Connect to Socket server
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      query: { token },
    });

    setSocket(newSocket);

    // Register user ID with Socket
    newSocket.emit('join', user._id);

    // Listen for new SOS request (for matching donors)
    newSocket.on('sos:new', (sosData) => {
      console.log('Received new SOS alert via Socket:', sosData);

      // Update local state list
      setIncomingSOSAlerts((prev) => [sosData, ...prev]);

      // Custom toast notification with sound/alert
      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-red-600 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-red-700`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg animate-pulse">
                  🚨
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">
                  URGENT: {sosData.bloodGroupNeeded} Required!
                </p>
                <p className="mt-1 text-xs text-red-100">
                  Hospital: {sosData.hospitalName} ({sosData.urgency} priority)
                </p>
                <p className="mt-1 text-xs text-red-200">
                  Contact: {sosData.contactPhone}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-red-500">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Action logic - redirects or opens dashboard
                window.location.href = '/donor/dashboard';
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
            >
              View
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    });

    // Listen for new SOS request alerts targeting blood banks
    newSocket.on('sos:bankAlert', (sosData) => {
      console.log('Received new SOS alert for Blood Bank via Socket:', sosData);

      setIncomingSOSAlerts((prev) => [sosData, ...prev]);

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-red-800 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-red-900`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg animate-pulse">
                  🏦
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">
                  BLOOD BANK SOS: {sosData.bloodGroupNeeded} Required!
                </p>
                <p className="mt-1 text-xs text-red-100">
                  Hospital: {sosData.hospitalName} ({sosData.urgency} priority)
                </p>
                <p className="mt-1 text-xs text-red-200">
                  Requester: {sosData.requester.name} ({sosData.requester.phone})
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-red-700">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/bloodbank/dashboard';
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-red-900 focus:outline-none"
            >
              Offer
            </button>
          </div>
        </div>
      ), { duration: 12000 });
    });

    // Listen for donor SOS response (for requesters)
    newSocket.on('sos:response', (responseData) => {
      console.log('Received SOS response alert via Socket:', responseData);

      const { donor, status } = responseData;
      const statusColor = status === 'accepted' ? 'text-green-600' : 'text-red-600';
      const statusIcon = status === 'accepted' ? '✅' : '❌';

      toast.success(
        <div>
          <span className="font-semibold">{donor.name}</span> ({donor.bloodGroup}) has{' '}
          <span className={`font-bold ${statusColor}`}>{status}</span> your SOS request!
        </div>,
        {
          icon: statusIcon,
          duration: 6000,
        }
      );

      // We dispatch a custom event to notify components to refresh their lists
      const refreshEvent = new CustomEvent('sos:response_received', { detail: responseData });
      window.dispatchEvent(refreshEvent);
    });

    // Listen for blood bank SOS response (for requesters)
    newSocket.on('sos:bankOffer', (offerData) => {
      console.log('Received blood bank stock offer via Socket:', offerData);

      const { bloodBank, unitsOffered } = offerData;

      toast.success(
        <div>
          Blood Bank <span className="font-semibold">{bloodBank.name}</span> has offered{' '}
          <span className="font-bold text-red-600">{unitsOffered} units</span> for your SOS request!
        </div>,
        {
          icon: '🏦',
          duration: 8000,
        }
      );

      const refreshEvent = new CustomEvent('sos:response_received', { detail: offerData });
      window.dispatchEvent(refreshEvent);
    });

    // Listen for low stock warnings (for blood banks)
    newSocket.on('inventory:low', (warnData) => {
      console.log('Received low stock warning via Socket:', warnData);

      toast(
        (t) => (
          <div className="flex items-center space-x-2 text-amber-800">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold text-xs">Low Stock Warning!</p>
              <p className="text-xxs text-amber-600">
                {warnData.bloodGroup} stock is down to {warnData.units} units (Threshold: {warnData.lowStockThreshold})
              </p>
            </div>
          </div>
        ),
        {
          duration: 8000,
          style: {
            background: '#fffbeb',
            border: '1px solid #fef3c7',
          },
        }
      );

      const stockEvent = new CustomEvent('inventory:low_warning', { detail: warnData });
      window.dispatchEvent(stockEvent);
    });

    // Cleanup on unmount/user logout
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const respondToSOS = (sosRequestId, status) => {
    if (socket) {
      socket.emit('sos:respond', { sosRequestId, status });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, incomingSOSAlerts, setIncomingSOSAlerts, respondToSOS }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
