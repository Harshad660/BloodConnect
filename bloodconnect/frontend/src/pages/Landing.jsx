import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, AlertTriangle, Users, MapPin, Activity, ShieldCheck, MailWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-950 text-white overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background decorative shapes */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-red-200 to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-500/30 rounded-full blur-2xl"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/30 border border-red-400/40 text-red-100 backdrop-blur-sm animate-pulse-fast">
              🚨 Emergency SOS Donor Broadcast Enabled
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-tight">
              Bridging the Gap When <br />
              <span className="text-red-200">Seconds Count</span>
            </h1>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              BloodConnect is a real-time geospatial donor matching and emergency SOS broadcasting network. We link critical blood requests with nearby available donors within minutes, saving lives when every moment is precious.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to={user ? (user.role === 'donor' ? '/donor/dashboard' : '/requester/dashboard') : '/signup'}
                className="w-full sm:w-auto bg-white text-red-700 font-extrabold px-8 py-4 rounded-xl text-base shadow-xl hover:bg-red-50 hover:shadow-2xl transition duration-150 transform hover:-translate-y-0.5 text-center flex items-center justify-center space-x-2"
              >
                <Heart className="h-5 w-5 fill-red-700" />
                <span>{user ? 'Go to Dashboard' : 'Register as Donor'}</span>
              </Link>
              <Link
                to="/search"
                className="w-full sm:w-auto bg-red-600/40 hover:bg-red-600/60 border border-red-400/30 text-white font-bold px-8 py-4 rounded-xl text-base backdrop-blur-sm shadow hover:shadow-lg transition duration-150 text-center flex items-center justify-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Search Donors</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            {/* Visual concept box */}
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl relative">
              <div className="absolute -top-5 -left-5 bg-red-500 text-white p-3.5 rounded-2xl shadow-lg animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white mb-4 flex items-center space-x-2">
                <span>Emergency Broadcasts</span>
              </h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 flex items-start space-x-3">
                  <div className="bg-red-500/40 text-red-200 p-2 rounded-lg font-bold">O-</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">City Hospital, Mumbai</h4>
                    <p className="text-xxs text-red-200">Critical Priority • 1.2 km away</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 flex items-start space-x-3">
                  <div className="bg-red-500/40 text-red-200 p-2 rounded-lg font-bold">AB+</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Apollo Clinic, Bangalore</h4>
                    <p className="text-xxs text-red-200">Medium Priority • 4.8 km away</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-red-200">
                  <span>Donors in Radius Notified</span>
                  <span className="font-bold text-white">Instant Broadcast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem & Solution */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest">The Problem We Solve</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display text-gray-900 leading-tight">
              Why Traditional Blood Requests Fail in Emergencies
            </h3>
            <p className="text-gray-600 leading-relaxed">
              When someone needs blood urgently, families run from hospital to hospital, post desperate messages on WhatsApp, or cold-call donor lists. These solutions are slow, chaotic, and reach donors too late.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <MapPin className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-gray-900">Geospatial Inaccuracy</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Calling donors from a national database is useless if they live hundreds of kilometers away. We filter donors within a tight, local radius using GPS coordinates.
              </p>
            </div>

            <div className="p-8 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <Activity className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-gray-900">Donor Availability</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Many listed donors are unavailable due to recent donations, travel, or health. BloodConnect allows donors to toggle availability in real time to filter out dead leads.
              </p>
            </div>

            <div className="p-8 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <MailWarning className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-gray-900">Slow Notifications</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Social posts rely on algorithms. Our platform triggers instant in-app alerts to matching donors via WebSockets, and falls back to nodemailer emails if they are offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50 border-y border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest">How It Works</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display text-gray-900 leading-tight">
              Three Simple Steps to Save a Life
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="space-y-4 relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-5xl font-black text-red-100 font-display">01</div>
              <h4 className="text-lg font-bold font-display text-gray-900">Post SOS Request</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                A requester inputs the required blood group, hospital location, and contact info, specifying search radius.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-5xl font-black text-red-100 font-display">02</div>
              <h4 className="text-lg font-bold font-display text-gray-900">Real-Time Alerts</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Matching available donors in the vicinity instantly receive dashboard toast alerts via socket connections or email fallbacks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-5xl font-black text-red-100 font-display">03</div>
              <h4 className="text-lg font-bold font-display text-gray-900">Direct Connection</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                As soon as a donor accepts, the requester sees their contact profile and coordinates donation details immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Verification */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Accounts
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display text-gray-900 leading-tight">
              Safety, Moderation, and Verification Guaranteed
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We care about trust. System administrators vet donor profiles, moderate records, and flag suspicious activities. Requesters can see who is verified, making sure only legitimate helpers respond.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <span className="bg-green-100 text-green-700 p-1 rounded-full">✓</span>
                <span className="text-sm font-semibold text-gray-700">Admin-verified donor badge</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-green-100 text-green-700 p-1 rounded-full">✓</span>
                <span className="text-sm font-semibold text-gray-700">Automated geolocation verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-green-100 text-green-700 p-1 rounded-full">✓</span>
                <span className="text-sm font-semibold text-gray-700">Safe communication via direct contact lines</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <div className="space-y-4 w-full max-w-md">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                    JD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Jane Donor</h4>
                    <p className="text-xxs text-gray-400">Donor • Bangalore</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 text-xxs font-bold px-2.5 py-1 rounded-full flex items-center space-x-0.5">
                  <span>✓ Verified Donor</span>
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                    RD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Rahul Dev</h4>
                    <p className="text-xxs text-gray-400">Donor • Mumbai</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 text-xxs font-bold px-2.5 py-1 rounded-full flex items-center space-x-0.5">
                  <span>✓ Verified Donor</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-gray-900 text-white py-16 text-center px-4 sm:px-6 lg:px-8 mt-auto border-t border-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <Heart className="h-12 w-12 text-red-500 fill-red-500 mx-auto animate-pulse" />
          <h2 className="text-3xl font-bold font-display">Ready to Make a Difference?</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            Your single donation can save up to three lives. Sign up as a donor today to start receiving alerts, or request an emergency match if you need help.
          </p>
          <div className="flex justify-center space-x-4 pt-2">
            {!user ? (
              <>
                <Link
                  to="/signup"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition duration-150"
                >
                  Join the Network
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-bold px-6 py-3 rounded-xl text-sm transition duration-150"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to={user.role === 'donor' ? '/donor/dashboard' : '/requester/dashboard'}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition duration-150"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
          <p className="text-xxs text-gray-600 pt-8">
            &copy; 2026 BloodConnect SOS Network. All rights reserved. Made for emergency support.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
