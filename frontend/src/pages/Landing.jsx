import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Heart,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HeroSection from "../components/HeroSection";

const Landing = () => {
  const { user } = useAuth();

  const dashboardPath =
    user?.role === "donor"
      ? "/donor/dashboard"
      : "/requester/dashboard";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-white">
      <HeroSection />

      {/* How BloodConnect helps */}
      <section className="border-b border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center animate-reveal-up">
            <p className="text-sm font-semibold text-red-600">
              How BloodConnect helps
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Faster help during blood emergencies
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              BloodConnect connects patients, nearby donors and blood banks
              through one simple platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="animate-reveal-up rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-transform duration-300 hover:scale-110">
                <MapPin className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Find nearby donors
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Search for compatible blood donors and blood banks available
                within your nearby area.
              </p>
            </div>

            <div className="animate-reveal-up animation-delay-150 rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-transform duration-300 hover:scale-110">
                <Activity className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Send emergency requests
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Send an SOS blood request to matching donors and blood banks
                when urgent support is needed.
              </p>
            </div>

            <div className="animate-reveal-up animation-delay-300 rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-transform duration-300 hover:scale-110">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Safe and secure
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                User roles and secure authentication help protect personal
                information and prevent unauthorized access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Motivational section */}
      <section className="overflow-hidden bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="animate-reveal-up">
            <p className="text-sm font-semibold text-red-600">
              Become a lifesaver
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              A few minutes of your time could give someone years of life.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-gray-600">
              Blood cannot be manufactured. It can only come from generous
              people who choose to help. Register as a donor and be there when
              someone nearby needs you.
            </p>

            <div className="mt-7">
              <Link
                to={user ? dashboardPath : "/signup"}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                {user ? "Go to Dashboard" : "Register as a Donor"}
              </Link>
            </div>
          </div>

          <div className="animate-gentle-float rounded-2xl border border-red-100 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl sm:p-9">
            <Heart className="animate-soft-heartbeat h-8 w-8 fill-red-600 text-red-600" />

            <p className="mt-6 text-2xl font-semibold leading-snug text-gray-900">
              “The blood you donate today may become someone’s second chance
              tomorrow.”
            </p>

            <div className="mt-7 border-t border-gray-200 pt-5">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-red-600" />

                <div>
                  <p className="font-semibold text-gray-900">
                    Help your community
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Stay available and respond when a compatible emergency
                    request reaches you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-gray-900 px-4 py-14 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl animate-reveal-up">
          <div className="animate-soft-heartbeat mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600">
            <Heart className="h-6 w-6 fill-current" />
          </div>

          <h2 className="mt-5 text-3xl font-bold">
            Be ready when someone needs you
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-300">
            Join BloodConnect and help make emergency blood support faster,
            simpler and more accessible.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {!user ? (
              <>
                <Link
                  to="/signup"
                  className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-lg"
                >
                  Join as a Donor
                </Link>

                <Link
                  to="/login"
                  className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:bg-gray-800"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to={dashboardPath}
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          <p className="mt-10 text-xs text-gray-500">
            © 2026 BloodConnect. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;