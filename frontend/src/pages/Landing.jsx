import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, AlertTriangle, Users, MapPin, Activity, ShieldCheck, MailWarning, Clock, ShieldCheck as VerifiedIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../components/HeroSection';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-clinical-bg">
      {/* Redesigned Dashboard-Style Hero Section */}
      <HeroSection />

      {/* Signature Divider Element (ECG Graph Line) */}
      <hr className="ecg-divider my-0" />

      {/* Trust, Verification & Network Security details */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8 border-b border-soft-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xxs uppercase tracking-widest text-brand-red font-black">Clinical Integrity</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-ink-dark">
              How We Establish Secure Clinical Trust
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              We operate as a high-trust verification portal. We vet both side profiles to ensure emergencies are real and donors are clinically eligible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-clinical-bg rounded-2xl border border-soft-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-ink-dark font-display">Geospatial Radial Anchor</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Traditional call lists fail if donors are hours away. BloodConnect maps active donor pins within a narrow, customized radial perimeter (e.g. 5km) from target hospital beds.
                </p>
              </div>
            </div>

            <div className="p-6 bg-clinical-bg rounded-2xl border border-soft-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 bg-trust-teal/10 text-trust-teal rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-ink-dark font-display">Tactile Status Eligibility</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Donors can toggle their active status instantly. A 90-day cooldown period is enforced after a logged donation to prevent physical stress and ensure correct blood yields.
                </p>
              </div>
            </div>

            <div className="p-6 bg-clinical-bg rounded-2xl border border-soft-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 bg-ink-dark/10 text-ink-dark rounded-xl flex items-center justify-center">
                  <VerifiedIcon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-ink-dark font-display">Verified Institution Seals</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Every Blood Bank and clinical organization on the portal is audited for licensing and certification numbers by administrative personnel before broadcasting stock offers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Live Active Donors Panel */}
      <section className="py-16 bg-clinical-bg px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xxs font-bold bg-trust-teal/10 border border-trust-teal/20 text-trust-teal">
              <VerifiedIcon className="h-3 w-3" />
              <span>SAFETY STANDARDS</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-ink-dark leading-tight">
              Verified Donor Matching
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We vet emergency logs and verify profile configurations to protect donors and coordinate reliable assistance. Check donor tags for verification badges when receiving responses.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-gray-700">
              <div className="flex items-center space-x-2.5">
                <span className="h-5 w-5 bg-trust-teal/10 rounded-full flex items-center justify-center text-trust-teal text-xxs">✓</span>
                <span>Admin Audited Donor Registration Documents</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="h-5 w-5 bg-trust-teal/10 rounded-full flex items-center justify-center text-trust-teal text-xxs">✓</span>
                <span>Verified Direct Coordinate Map Anchors</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="h-5 w-5 bg-trust-teal/10 rounded-full flex items-center justify-center text-trust-teal text-xxs">✓</span>
                <span>Protected Contact Details Routing</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center bg-white p-8 rounded-3xl border border-soft-border shadow-sm">
            <div className="space-y-3.5 w-full max-w-md">
              <div className="bg-clinical-bg p-4 rounded-2xl border border-soft-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="wristband-badge verified font-mono text-xxs">A+</div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-dark">Jane Donor</h4>
                    <p className="text-xxs text-gray-400">Anchor: Bangalore Center</p>
                  </div>
                </div>
                <span className="text-[10px] text-trust-teal font-extrabold bg-trust-teal/10 px-2.5 py-1 rounded-full">
                  ✓ Verified Donor
                </span>
              </div>

              <div className="bg-clinical-bg p-4 rounded-2xl border border-soft-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="wristband-badge verified font-mono text-xxs">O-</div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-dark">Rahul Dev</h4>
                    <p className="text-xxs text-gray-400">Anchor: Indiranagar Area</p>
                  </div>
                </div>
                <span className="text-[10px] text-trust-teal font-extrabold bg-trust-teal/10 px-2.5 py-1 rounded-full">
                  ✓ Verified Donor
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding Area */}
      <section className="bg-ink-dark text-white py-12 text-center px-4 sm:px-6 lg:px-8 border-t border-white/10 mt-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="wristband-badge verified mx-auto">
            <span className="font-mono text-xxs tracking-widest text-ink-dark font-black">BC_NET</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Join the Emergency Support Network</h2>
          <p className="text-gray-400 text-xs max-w-md mx-auto leading-relaxed">
            Your single response can hold a critical bridge. Register to stand by or broadcast immediate requests.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {!user ? (
              <>
                <Link
                  to="/signup"
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition duration-150"
                >
                  Join as Donor
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-150"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to={user.role === 'donor' ? '/donor/dashboard' : '/requester/dashboard'}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-150"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
          <p className="text-[10px] text-gray-600 pt-6">
            &copy; 2026 BloodConnect SOS Network. All rights reserved. Vetted emergency coordination portal.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
