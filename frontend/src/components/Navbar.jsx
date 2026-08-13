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

  const activeClass = 'bg-brand-red/5 text-brand-red font-semibold border-b-2 border-brand-red';
  const inactiveClass = 'text-gray-600 hover:text-brand-red hover:bg-brand-red/5';

  return (
    <nav className="bg-white border-b border-soft-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5 tracking-tight group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-red/5 border border-brand-red/10 group-hover:bg-brand-red/10 transition-colors duration-200">
                <svg className="w-6 h-6 text-brand-red animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C16 21 18 17 18 13.5C18 10 12 3 12 3C12 3 6 10 6 13.5C6 17 8 21 12 21Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="1.5" fill="currentColor" />
                  <path d="M12 11.5V14.5M10.5 13H13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="17" cy="17" r="1" fill="currentColor" className="animate-ping" style={{ transformOrigin: 'center' }} />
                  <circle cx="17" cy="17" r="1" fill="currentColor" />
                  <circle cx="7" cy="17" r="1" fill="currentColor" />
                  <line x1="12" y1="13" x2="17" y2="17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="12" y1="13" x2="7" y2="17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              </div>
              <span className="font-display font-black text-2xl text-ink-dark group-hover:text-brand-red transition-colors duration-150">
                Blood<span className="text-brand-red">Connect</span>
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
                  className="ml-2 bg-sos-red hover:bg-sos-red/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition duration-150 flex items-center space-x-2 shadow-sm relative group overflow-hidden"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
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
                  className="p-2 rounded-full text-gray-500 hover:text-brand-red hover:bg-brand-red/5 focus:outline-none transition duration-150"
                >
                  <Bell className="h-6 w-6" />
                  {incomingSOSAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-sos-red ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-soft-border py-1 z-50">
                    <div className="px-4 py-2 border-b border-soft-border flex justify-between items-center bg-clinical-bg rounded-t-xl">
                      <span className="font-semibold text-ink-dark text-sm">SOS Notifications</span>
                      {incomingSOSAlerts.length > 0 && (
                        <button
                          onClick={() => setIncomingSOSAlerts([])}
                          className="text-xs text-brand-red hover:text-brand-red/80 font-medium"
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
                            className="px-4 py-3 hover:bg-brand-red/5 border-b border-soft-border last:border-b-0 cursor-pointer"
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(user.role === 'bloodbank' ? '/bloodbank/dashboard' : '/donor/dashboard');
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="wristband-badge sos">
                                {alert.bloodGroupNeeded}
                              </span>
                              <span className="text-xxs text-gray-400">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-ink-dark font-medium mt-1">
                              {alert.hospitalName}
                            </p>
                            <p className="text-xxs text-gray-500 mt-0.5">
                              Priority: <span className="font-semibold text-sos-red capitalize">{alert.urgency}</span>
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
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-soft-border">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-ink-dark">{user.name}</span>
                  <span className="text-xxs text-gray-400 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-brand-red hover:bg-brand-red/5 rounded-lg transition duration-150"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-brand-red px-3 py-2 rounded-lg text-sm font-semibold transition duration-150"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-ink-dark hover:bg-ink-dark/95 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition duration-150"
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
                  className="p-2 rounded-full text-gray-500 hover:text-brand-red focus:outline-none"
                >
                  <Bell className="h-6 w-6" />
                  {incomingSOSAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-sos-red ring-2 ring-white animate-pulse" />
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
        <div className="md:hidden border-b border-soft-border bg-white animate-enter">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/search"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/search') ? 'bg-brand-red/5 text-brand-red' : 'text-gray-600'
                }`}
            >
              Search Donors
            </Link>

            {user && user.role === 'requester' && (
              <>
                <Link
                  to="/requester/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/requester/dashboard') ? 'bg-brand-red/5 text-brand-red' : 'text-gray-600'
                    }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sos/new"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-sos-red text-white font-bold"
                >
                  Request SOS
                </Link>
              </>
            )}

            {user && user.role === 'donor' && (
              <Link
                to="/donor/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/donor/dashboard') ? 'bg-brand-red/5 text-brand-red' : 'text-gray-600'
                  }`}
              >
                Donor Dashboard
              </Link>
            )}

            {user && user.role === 'bloodbank' && (
              <Link
                to="/bloodbank/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/bloodbank/dashboard') ? 'bg-brand-red/5 text-brand-red' : 'text-gray-600'
                  }`}
              >
                Bank Dashboard
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'bg-brand-red/5 text-brand-red' : 'text-gray-600'
                  }`}
              >
                Admin Panel
              </Link>
            )}

            {user ? (
              <div className="pt-4 pb-2 border-t border-soft-border mt-2">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0 bg-brand-red/10 p-2 rounded-full text-brand-red">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-ink-dark">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>
                <div className="mt-3 px-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-brand-red/5 hover:text-brand-red"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-soft-border flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-gray-600 font-semibold border border-soft-border rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 bg-brand-red text-white font-semibold rounded-lg shadow-sm"
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
