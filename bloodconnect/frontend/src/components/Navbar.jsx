import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Heart, LogOut, Bell, Search, AlertTriangle, User, ShieldAlert, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { incomingSOSAlerts, setIncomingSOSAlerts } = useSocket() || { incomingSOSAlerts: [] };
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const activeClass = 'bg-red-50 text-red-600 font-semibold border-b-2 border-red-600';
  const inactiveClass = 'text-gray-600 hover:text-red-600 hover:bg-red-50/50';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-red-600 font-black text-2xl tracking-tight">
              <span className="bg-red-600 text-white p-1.5 rounded-lg">
                <Heart className="h-6 w-6 fill-white" />
              </span>
              <span>
                Blood<span className="text-gray-800">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/search"
              className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center space-x-1.5 ${isActive('/search') ? activeClass : inactiveClass
                }`}
            >
              <Search className="h-4 w-4" />
              <span>Search Donors</span>
            </Link>

            {user && user.role === 'requester' && (
              <>
                <Link
                  to="/requester/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${isActive('/requester/dashboard') ? activeClass : inactiveClass
                    }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sos/new"
                  className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-150 flex items-center space-x-1.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                  <span>Request SOS</span>
                </Link>
              </>
            )}

            {user && user.role === 'donor' && (
              <Link
                to="/donor/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${isActive('/donor/dashboard') ? activeClass : inactiveClass
                  }`}
              >
                Donor Dashboard
              </Link>
            )}

            {user && user.role === 'bloodbank' && (
              <Link
                to="/bloodbank/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${isActive('/bloodbank/dashboard') ? activeClass : inactiveClass
                  }`}
              >
                Bank Dashboard
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center space-x-1 ${isActive('/admin') ? activeClass : inactiveClass
                  }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Notification Bell for Donors & Blood Banks */}
            {user && (user.role === 'donor' || user.role === 'bloodbank') && (
              <div className="relative ml-3">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none transition duration-150"
                >
                  <Bell className="h-6 w-6" />
                  {incomingSOSAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <span className="font-semibold text-gray-800 text-sm">SOS Notifications</span>
                      {incomingSOSAlerts.length > 0 && (
                        <button
                          onClick={() => setIncomingSOSAlerts([])}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {incomingSOSAlerts.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          No active SOS requests
                        </div>
                      ) : (
                        incomingSOSAlerts.map((alert, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 hover:bg-red-50/30 border-b border-gray-50 last:border-b-0 cursor-pointer"
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(user.role === 'bloodbank' ? '/bloodbank/dashboard' : '/donor/dashboard');
                            }}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold text-red-600 text-xs bg-red-100 px-2 py-0.5 rounded">
                                {alert.bloodGroupNeeded} Required
                              </span>
                              <span className="text-xxs text-gray-400">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 font-medium mt-1">
                              {alert.hospitalName}
                            </p>
                            <p className="text-xxs text-gray-500 mt-0.5">
                              Priority: <span className="font-semibold text-red-500 capitalize">{alert.urgency}</span>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-100">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-800">{user.name}</span>
                  <span className="text-xxs text-gray-500 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-semibold transition duration-150"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition duration-150"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {user && (user.role === 'donor' || user.role === 'bloodbank') && (
              <div className="relative mr-2">
                <button
                  onClick={() => navigate(user.role === 'bloodbank' ? '/bloodbank/dashboard' : '/donor/dashboard')}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 focus:outline-none"
                >
                  <Bell className="h-6 w-6" />
                  {incomingSOSAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                  )}
                </button>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/search"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/search') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                }`}
            >
              Search Donors
            </Link>

            {user && user.role === 'requester' && (
              <>
                <Link
                  to="/requester/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/requester/dashboard') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                    }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sos/new"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 text-white"
                >
                  Request SOS
                </Link>
              </>
            )}

            {user && user.role === 'donor' && (
              <Link
                to="/donor/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/donor/dashboard') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                  }`}
              >
                Donor Dashboard
              </Link>
            )}

            {user && user.role === 'bloodbank' && (
              <Link
                to="/bloodbank/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/bloodbank/dashboard') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                  }`}
              >
                Bank Dashboard
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                  }`}
              >
                Admin Panel
              </Link>
            )}

            {user ? (
              <div className="pt-4 pb-2 border-t border-gray-100 mt-2">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0 bg-red-100 p-2 rounded-full text-red-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>
                <div className="mt-3 px-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-gray-600 font-semibold border border-gray-200 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
