import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { Search as SearchIcon, MapPin, Sliders, Heart, Navigation, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Pins
const redDonorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueRequesterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenBankIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks for changing reference location
const SearchMapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to dynamically focus/pan map
const MapPanner = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Search = () => {
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(10); // default 10km
  
  // Requester reference point (defaults to Bangalore center)
  const [reqCoords, setReqCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [gpsDetected, setGpsDetected] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [searchTab, setSearchTab] = useState('donors'); // 'donors' or 'banks'
  
  const [donors, setDonors] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial trigger to search for all available donors and blood banks on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let queryParams = `?radius=${radius}`;
      if (bloodGroup) queryParams += `&bloodGroup=${encodeURIComponent(bloodGroup)}`;
      
      // If coordinates are set or gpsDetected, append coordinates
      if (reqCoords.lat && reqCoords.lng) {
        queryParams += `&lat=${reqCoords.lat}&lng=${reqCoords.lng}`;
      }
      
      // City search acts as fallback/filter
      if (city) {
        queryParams += `&city=${encodeURIComponent(city)}`;
      }

      const res = await api.get(`/search/combined${queryParams}`);
      if (res.data.success) {
        setDonors(res.data.data.donors);
        setBloodBanks(res.data.data.bloodBanks);
      }
    } catch (err) {
      console.error('Search failure:', err);
      setError('Failed to fetch matching results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setReqCoords({ lat: latitude, lng: longitude });
        setGpsDetected(true);
        setDetectingGps(false);
        // Instant trigger matching after updating position
        triggerSearchWithCoords(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not locate you. Please click on the map to set your location pin.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const triggerSearchWithCoords = async (latitude, longitude) => {
    setLoading(true);
    try {
      let queryParams = `?lat=${latitude}&lng=${longitude}&radius=${radius}`;
      if (bloodGroup) queryParams += `&bloodGroup=${encodeURIComponent(bloodGroup)}`;
      if (city) queryParams += `&city=${encodeURIComponent(city)}`;

      const res = await api.get(`/search/combined${queryParams}`);
      if (res.data.success) {
        setDonors(res.data.data.donors);
        setBloodBanks(res.data.data.bloodBanks);
      }
    } catch (err) {
      console.error(err);
      setError('Search failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat, lng) => {
    setReqCoords({ lat, lng });
    setGpsDetected(true);
    triggerSearchWithCoords(lat, lng);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-clinical-bg">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-soft-border pb-5">
        <div>
          <h1 className="text-3xl font-black font-display text-ink-dark flex items-center space-x-2.5">
            <span className="bg-brand-red/10 text-brand-red p-2 rounded-xl">
              <SearchIcon className="h-6 w-6" />
            </span>
            <span>Geospatial Directory</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Locate verified active donors and registered blood bank units nearby. Click on the map to re-anchor your search coordinates.
          </p>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={detectingGps}
          className="flex items-center justify-center space-x-2 bg-brand-red hover:bg-brand-red/95 text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-sm transition duration-150 disabled:opacity-50"
        >
          <Navigation className={`h-4 w-4 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? 'Locating Anchor...' : 'Use My GPS Coordinates'}</span>
        </button>
      </div>

      {/* Grid Layout: Left filters/sidebar, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters and List - 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          {/* Filters Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-soft-border space-y-5">
            <h3 className="text-xs font-bold text-ink-dark uppercase tracking-widest flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-brand-red" />
              <span>Anchor Specifications</span>
            </h3>

            <form onSubmit={handleSearch} className="space-y-4">
              {/* Blood Group Tactile Selector Grid */}
              <div>
                <label className="block text-xxs font-black text-gray-500 uppercase tracking-widest mb-2">
                  Target Blood Type *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBloodGroup('')}
                    className={`py-2 text-center text-xs font-mono rounded-lg border font-bold transition duration-150 ${
                      bloodGroup === ''
                        ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm shadow-brand-red/10'
                        : 'border-soft-border bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    ALL
                  </button>
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2 text-center text-xs font-mono rounded-lg border font-bold transition duration-150 ${
                        bloodGroup === bg
                          ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm shadow-brand-red/10'
                          : 'border-soft-border bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xxs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  City Location Filter
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="block w-full px-4 py-2.5 border border-soft-border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red transition duration-150 bg-clinical-bg/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xxs font-black text-gray-500 uppercase tracking-widest">
                    Search Radius (Perimeter)
                  </label>
                  <span className="text-xs font-black text-brand-red bg-brand-red/5 px-2 py-0.5 rounded-md font-mono">{radius} KM</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-clinical-bg rounded-lg appearance-none cursor-pointer accent-brand-red"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink-dark hover:bg-ink-dark/95 text-white font-extrabold py-3 px-4 rounded-xl text-xs tracking-wider uppercase shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Synchronize Query</span>
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="flex bg-white/70 p-1 rounded-xl border border-soft-border">
              <button
                type="button"
                onClick={() => setSearchTab('donors')}
                className={`flex-1 py-2 text-xxs tracking-wider uppercase font-extrabold rounded-lg transition duration-150 ${
                  searchTab === 'donors' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
                }`}
              >
                Available Donors ({donors.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchTab('banks')}
                className={`flex-1 py-2 text-xxs tracking-wider uppercase font-extrabold rounded-lg transition duration-150 ${
                  searchTab === 'banks' ? 'bg-ink-dark text-white shadow-xs' : 'text-gray-500 hover:text-ink-dark'
                }`}
              >
                Stocked Banks ({bloodBanks.length})
              </button>
            </div>

            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between px-1">
              <span>{searchTab === 'donors' ? 'Nearby Verified Donors' : 'Nearby Stock Offers'}</span>
              {gpsDetected && (
                <span className="text-[10px] text-brand-red font-medium lowercase font-mono">
                  distance calculated from pin anchor
                </span>
              )}
            </h3>

            {error && (
              <div className="bg-sos-red/10 border border-sos-red/35 text-sos-red px-4 py-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchTab === 'donors' ? (
                donors.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-soft-border text-center text-gray-400 text-xs font-medium">
                    No matching active donors found within this perimeter. Expand your radius range or verify type requirements.
                  </div>
                ) : (
                  donors.map((donor) => (
                    <div
                      key={donor._id}
                      className="bg-white p-4 rounded-2xl shadow-xs border border-soft-border hover:border-brand-red/30 transition duration-150 flex justify-between items-start"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <span className={`wristband-badge ${donor.isVerified ? 'verified' : ''} font-mono font-bold text-xs`}>
                            {donor.bloodGroup}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-ink-dark flex items-center">
                              <span>{donor.name}</span>
                              {donor.isVerified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-trust-teal fill-trust-teal/10 ml-1" />
                              )}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {donor.city}, {donor.pincode}
                            </p>
                          </div>
                        </div>
                        
                        {donor.lastDonationDate ? (
                          <p className="text-[10px] text-gray-500 font-semibold font-mono">
                            Last Donation: {new Date(donor.lastDonationDate).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic">No recent donation logged</p>
                        )}
                      </div>

                      <div className="text-right space-y-1.5">
                        {donor.distance !== null ? (
                          <span className="inline-block bg-brand-red/5 text-brand-red font-black text-xxs px-2.5 py-0.5 rounded-full border border-brand-red/10 font-mono">
                            {donor.distance} km away
                          </span>
                        ) : (
                          <span className="inline-block bg-clinical-bg text-gray-600 font-bold text-xxs px-2.5 py-0.5 rounded-full border border-soft-border">
                            City Area
                          </span>
                        )}

                        <a
                          href={`tel:${donor.phone}`}
                          className="flex items-center justify-end text-[10px] text-gray-500 hover:text-brand-red font-black pt-1"
                        >
                          <Phone className="h-3 w-3 mr-1 text-brand-red" />
                          <span>{donor.phone}</span>
                        </a>
                      </div>
                    </div>
                  ))
                )
              ) : (
                bloodBanks.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-soft-border text-center text-gray-400 text-xs font-medium">
                    No matching blood bank units found.
                  </div>
                ) : (
                  bloodBanks.map((bank) => {
                    const groupStock = bank.inventory.find(i => i.bloodGroup === (bloodGroup || 'O+'));
                    const unitsCount = groupStock ? groupStock.units : 0;

                    return (
                      <div
                        key={bank._id}
                        className="bg-white p-4 rounded-2xl shadow-xs border border-soft-border hover:border-brand-red/30 transition duration-150 flex justify-between items-start"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="h-7 w-7 bg-ink-dark/10 text-ink-dark rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                              🏦
                            </span>
                            <div>
                              <h4 className="text-sm font-extrabold text-ink-dark flex items-center">
                                <span>{bank.name}</span>
                                {bank.isVerified && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-trust-teal fill-trust-teal/10 ml-1" />
                                )}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-mono">
                                {bank.address}, {bank.city}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-brand-red font-black font-mono">
                            Stock: {unitsCount} units of {bloodGroup || 'O+'}
                          </p>
                        </div>

                        <div className="text-right space-y-1.5">
                          {bank.distance !== null ? (
                            <span className="inline-block bg-brand-red/5 text-brand-red font-black text-xxs px-2.5 py-0.5 rounded-full border border-brand-red/10 font-mono">
                              {bank.distance} km away
                            </span>
                          ) : (
                            <span className="inline-block bg-clinical-bg text-gray-600 font-bold text-xxs px-2.5 py-0.5 rounded-full border border-soft-border">
                              City Area
                            </span>
                          )}

                          <a
                            href={`tel:${bank.phone}`}
                            className="flex items-center justify-end text-[10px] text-gray-500 hover:text-brand-red font-black pt-1"
                          >
                            <Phone className="h-3 w-3 mr-1 text-brand-red" />
                            <span>{bank.phone}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </div>

        {/* Map Display Panel - 7 Columns */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 shadow-xs border border-soft-border space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-ink-dark px-1">
            <span className="flex items-center space-x-1.5 uppercase tracking-wider text-xxs text-gray-400">
              <MapPin className="h-4 w-4 text-brand-red" />
              <span>Radial Geospatial Radar</span>
            </span>
            <span className="text-[10px] text-gray-400 font-normal italic">
              * click map to set center anchor coordinates
            </span>
          </div>

          <div className="h-[44rem] w-full rounded-2xl overflow-hidden border border-soft-border shadow-inner relative z-10">
            <MapContainer
              center={[reqCoords.lat, reqCoords.lng]}
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Blue Marker representing search point */}
              <Marker position={[reqCoords.lat, reqCoords.lng]} icon={blueRequesterIcon}>
                <Popup>
                  <div className="text-xs space-y-1 text-center font-medium">
                    <p className="font-extrabold text-blue-600">Search Anchor Reference</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Lat: {reqCoords.lat.toFixed(4)}<br />
                      Lng: {reqCoords.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Red Markers for each Donor */}
              {donors.map((donor) => {
                const coordinates = donor.location?.coordinates;
                if (!coordinates || coordinates.length !== 2) return null;
                const [lng, lat] = coordinates;
                
                return (
                  <Marker key={donor._id} position={[lat, lng]} icon={redDonorIcon}>
                    <Popup>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center space-x-1.5 border-b border-soft-border pb-1">
                          <span className="wristband-badge font-bold font-mono">
                            {donor.bloodGroup}
                          </span>
                          <span className="font-extrabold text-ink-dark">{donor.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">Phone: {donor.phone}</p>
                        {donor.distance !== null && (
                          <p className="text-[10px] text-brand-red font-black font-mono">
                            Distance: {donor.distance} km
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">City: {donor.city}</p>
                        <a
                          href={`tel:${donor.phone}`}
                          className="mt-1.5 block w-full bg-brand-red hover:bg-brand-red/90 text-white text-center font-extrabold py-1.5 rounded-lg text-xxs transition duration-150"
                        >
                          Call Donor
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Green Markers for each Blood Bank */}
              {bloodBanks.map((bank) => {
                const coordinates = bank.location?.coordinates;
                if (!coordinates || coordinates.length !== 2) return null;
                const [lng, lat] = coordinates;
                
                const groupStock = bank.inventory.find(i => i.bloodGroup === (bloodGroup || 'O+'));
                const unitsCount = groupStock ? groupStock.units : 0;

                return (
                  <Marker key={bank._id} position={[lat, lng]} icon={greenBankIcon}>
                    <Popup>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center space-x-1.5 border-b border-soft-border pb-1">
                          <span className="h-5 w-5 bg-ink-dark text-white rounded flex items-center justify-center font-bold text-[10px]">
                            🏦
                          </span>
                          <span className="font-extrabold text-ink-dark">{bank.name}</span>
                        </div>
                        <p className="text-[10px] font-black text-brand-red font-mono">
                          Stock: {unitsCount} units of {bloodGroup || 'O+'}
                        </p>
                        <p className="text-[10px] text-gray-500">Address: {bank.address}, {bank.city}</p>
                        {bank.distance !== null && (
                          <p className="text-[10px] text-gray-600 font-bold font-mono">
                            Distance: {bank.distance} km
                          </p>
                        )}
                        <a
                          href={`tel:${bank.phone}`}
                          className="mt-1.5 block w-full bg-ink-dark hover:bg-ink-dark/95 text-white text-center font-extrabold py-1.5 rounded-lg text-xxs transition duration-150"
                        >
                          Call Bank
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <SearchMapEvents onMapClick={handleMapClick} />
              <MapPanner center={[reqCoords.lat, reqCoords.lng]} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
