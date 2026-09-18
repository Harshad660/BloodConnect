import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Heart,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-rose-50 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        
        {/* Left content */}
        <div className="hero-content-animation">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>

            <span className="text-xs font-semibold text-red-700">
              Emergency donor network
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Someone nearby may be waiting for{" "}
            <span className="relative text-red-600">
              your help.
              <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-red-100" />
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Find nearby blood donors and blood banks when every minute matters.
            A small action from you can give someone another chance at life.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={user ? "/sos/new" : "/login"}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <AlertTriangle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
              Request Blood
            </Link>

            <Link
              to={user ? "/donor/dashboard" : "/signup"}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:bg-red-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <Heart className="h-4 w-4 fill-red-600 text-red-600 transition-transform duration-300 group-hover:scale-125" />
              Become a Donor
            </Link>
          </div>

          {/* Trust information */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              Donors within 10 km
            </span>

            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              Secure and verified
            </span>
          </div>
        </div>

        {/* Image section */}
        <div className="relative image-entry-animation">
          
          {/* Floating blood-group symbols */}
          <div className="floating-symbol absolute -left-5 top-12 z-20 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-white font-bold text-red-600 shadow-lg">
            O+
          </div>

          <div className="floating-symbol-delayed absolute -right-4 bottom-24 z-20 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-600 shadow-lg">
            A+
          </div>

          {/* Main image */}
          <div className="group relative overflow-hidden rounded-3xl bg-gray-100 shadow-xl">
            <img
              src="https://wockhardthospitals.com/wp-content/uploads/2020/01/shutterstock_264395594-1-768x768-1.webp"
              alt="Volunteer donating blood at a healthcare centre"
              className="h-[430px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Image gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

            {/* Message displayed on image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
              <div className="flex items-start gap-3">
                <div className="heart-animation flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600">
                  <Heart className="h-5 w-5 fill-white" />
                </div>

                <div>
                  <p className="text-lg font-semibold">
                    One donation can save lives
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-200">
                    Your support can give a family hope during its most
                    difficult moment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verified card */}
          <div className="absolute -bottom-6 left-6 right-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xl sm:left-10 sm:right-auto sm:min-w-[260px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Verified donor network
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                Safe and reliable connections
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;