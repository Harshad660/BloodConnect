import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle, Users, Clock, Activity, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HeroSection = () => {
  const { user } = useAuth();
  const [donorCount, setDonorCount] = useState(0);

  useEffect(() => {
    // Respect reduced-motion settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDonorCount(142);
      return;
    }

    let start = 0;
    const end = 142;
    const duration = 1500; // 1.5 seconds
    const intervalTime = 16; // ~60fps
    const step = (end / (duration / intervalTime));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDonorCount(end);
        clearInterval(timer);
      } else {
        setDonorCount(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-clinical-bg border-b border-soft-border py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Human Message, CTAs, and Photo */}
        <div className="lg:col-span-6 flex flex-col space-y-8">
          {/* Header Message block */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xxs font-bold bg-sos-red/10 border border-sos-red/30 text-sos-red">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sos-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sos-red"></span>
              </span>
              <span>EMERGENCY DISPATCH SYSTEM ACTIVE</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight text-ink-dark">
              When standard blood stocks are empty, <span className="text-brand-red">seconds save lives.</span>
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-xl">
              BloodConnect instantly links critical hospital demands to registered standby donors within an active 10km radius. No middlemen, no delays.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={user ? "/sos/new" : "/login"}
              className="inline-flex items-center justify-center space-x-2 bg-sos-red hover:bg-sos-red/90 text-white font-extrabold px-8 py-4 rounded-xl text-sm tracking-wide shadow-lg shadow-sos-red/20 transition duration-150 transform hover:-translate-y-0.5 text-center"
            >
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span>Request Blood Now</span>
            </Link>

            <Link
              to={user ? "/donor/dashboard" : "/signup"}
              className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-ink-dark border border-soft-border font-bold px-8 py-4 rounded-xl text-sm transition duration-150 text-center"
            >
              <Heart className="h-4 w-4 text-brand-red fill-brand-red" />
              <span>Become a Donor</span>
            </Link>
          </div>

          {/* Real Human Photo */}
          <div className="relative rounded-2xl overflow-hidden border border-soft-border shadow-sm bg-white p-2">
            <img 
              src="/images/donor_hero.png" 
              alt="Community donor smiling during a warm local donation session" 
              className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-xl"
            />
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-soft-border px-3.5 py-1.5 rounded-xl shadow-sm text-xxs font-extrabold flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-trust-teal animate-pulse"></span>
              <span className="text-ink-dark">Active Coordination Camp</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Dashboard Mockup Panel */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-soft-border shadow-xl p-5 sm:p-6 space-y-5 relative overflow-hidden">
            
            {/* Live Indicator Topbar */}
            <div className="flex items-center justify-between border-b border-soft-border pb-3.5">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-trust-teal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-trust-teal"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-dark">Live Network Status</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-clinical-bg px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3 text-trust-teal" /> Real-time Feed
              </span>
            </div>

            {/* Counters Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-clinical-bg/70 border border-soft-border/70 rounded-2xl p-3.5">
                <p className="text-3xl font-black text-ink-dark font-display leading-tight">{donorCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">Active Donors Online</p>
              </div>
              <div className="bg-clinical-bg/70 border border-soft-border/70 rounded-2xl p-3.5">
                <p className="text-3xl font-black text-trust-teal font-display leading-tight">4.2 min</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">Avg Matching Speed</p>
              </div>
            </div>

            {/* Live Map Snippet */}
            <div className="relative h-44 bg-slate-50 border border-soft-border rounded-2xl overflow-hidden shadow-inner">
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>
              
              {/* Custom SVG Maps vector lines */}
              <svg className="absolute inset-0 h-full w-full text-slate-200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M-20,50 Q120,65 240,40 T440,80" />
                <path d="M80,-20 V200" />
                <path d="M220,-20 Q160,80 260,220" />
                <path d="M-20,130 H440" strokeWidth="4" className="text-slate-100" />
                <path d="M-20,130 H440" strokeDasharray="5 5" strokeWidth="1.5" />
              </svg>
              
              {/* SOS Emergency marker (Red pulse) */}
              <div className="absolute top-[60px] left-[150px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-6 w-6 justify-center items-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sos-red opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sos-red"></span>
                </span>
                <span className="mt-1 bg-sos-red text-white font-extrabold text-[8px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  Emergency: O- Needed
                </span>
              </div>

              {/* Active Donor coordinates (Teal pulses) */}
              <div className="absolute top-[110px] left-[70px] transform -translate-x-1/2 -translate-y-1/2">
                <span className="relative flex h-5 w-5 justify-center items-center">
                  <span className="animate-pulse-fast absolute inline-flex h-full w-full rounded-full bg-trust-teal opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-trust-teal"></span>
                </span>
              </div>

              <div className="absolute top-[35px] left-[290px] transform -translate-x-1/2 -translate-y-1/2">
                <span className="relative flex h-5 w-5 justify-center items-center">
                  <span className="animate-pulse-fast absolute inline-flex h-full w-full rounded-full bg-trust-teal opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-trust-teal"></span>
                </span>
              </div>

              <div className="absolute top-[135px] left-[230px] transform -translate-x-1/2 -translate-y-1/2">
                <span className="relative flex h-5 w-5 justify-center items-center">
                  <span className="animate-pulse-fast absolute inline-flex h-full w-full rounded-full bg-trust-teal opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-trust-teal"></span>
                </span>
              </div>
            </div>

            {/* Mini SOS Card notification */}
            <div className="bg-white border border-soft-border rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-150 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-sos-red"></div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 pl-1">
                  <div className="wristband-badge sos font-mono flex items-center justify-center h-8 w-8 text-xs font-black shadow-inner">
                    O-
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-black text-ink-dark font-display">St. John's Hospital ER</h4>
                      <span className="h-1.5 w-1.5 rounded-full bg-sos-red animate-pulse"></span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Critical priority • Broadcast sent</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-sos-red bg-sos-red/10 px-2 py-0.5 rounded-md">
                  2m ago
                </span>
              </div>

              <div className="mt-3 pl-1 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1 text-gray-500">
                  <Users className="h-3 w-3 text-trust-teal" />
                  <span>3 nearby donors notified</span>
                </div>
                <span className="font-extrabold text-trust-teal flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-trust-teal animate-ping"></span>
                  1.8 km away
                </span>
              </div>
            </div>

            {/* Tiny Inventory Strip */}
            <div className="bg-clinical-bg/50 border border-soft-border rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Critical Stock Inventory</span>
                <span className="text-[9px] font-extrabold text-trust-teal flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-trust-teal animate-pulse"></span> Live
                </span>
              </div>
              <div className="flex gap-2">
                <div className="bg-white border border-soft-border/80 rounded-lg p-2 flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-ink-dark font-mono">O-</span>
                  <span className="text-[10px] font-extrabold text-sos-red bg-sos-red/10 px-1.5 py-0.5 rounded">4 units</span>
                </div>
                <div className="bg-white border border-soft-border/80 rounded-lg p-2 flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-ink-dark font-mono">A+</span>
                  <span className="text-[10px] font-extrabold text-trust-teal bg-trust-teal/10 px-1.5 py-0.5 rounded">12 units</span>
                </div>
                <div className="bg-white border border-soft-border/80 rounded-lg p-2 flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-ink-dark font-mono">B+</span>
                  <span className="text-[10px] font-extrabold text-trust-teal bg-trust-teal/10 px-1.5 py-0.5 rounded">8 units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
