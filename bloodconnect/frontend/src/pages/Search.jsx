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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-black font-display text-gray-900 flex items-center space-x-2">
            <span className="bg-red-100 text-red-600 p-1.5 rounded-lg">
              <SearchIcon className="h-6 w-6" />
            </span>
            <span>Search Blood Donors</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find active donors within your vicinity in real time. Use the map to select your coordinate anchor.
          </p>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={detectingGps}
          className="flex items-center justify-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition duration-150 disabled:opacity-50"
        >
          <Navigation className={`h-4 w-4 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? 'Detecting Location...' : 'Use My GPS Location'}</span>
        </button>
      </div>

      {/* Grid Layout: Left filter + results list, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters and List - 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          {/* Filters Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <Sliders className="h-4 w-4 text-red-500" />
              <span>Search Filters</span>
            </h3>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  >
                    <option value="">All Groups</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    City Name
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="block w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xxs font-bold text-gray-500 uppercase tracking-wider">
                    Radius Range (km)
                  </label>
                  <span className="text-xs font-bold text-red-600">{radius} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Apply & Search</span>
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-250/60">
              <button
                type="button"
                onClick={() => setSearchTab('donors')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${
                  searchTab === 'donors' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                }`}
              >
                Donors ({donors.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchTab('banks')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${
                  searchTab === 'banks' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                }`}
              >
                Blood Banks ({bloodBanks.length})
              </button>
            </div>

            <h3 className="text-sm font-bold text-gray-800 flex items-center justify-between">
              <span>{searchTab === 'donors' ? 'Matching Donors' : 'Nearby Blood Banks'}</span>
              {gpsDetected && (
                <span className="text-xxs text-gray-400 font-normal italic">
                  Distance from blue pin
                </span>
              )}
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchTab === 'donors' ? (
                donors.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-150 text-center text-gray-400 text-sm">
                    No available matching donors found. Try increasing the search radius or expanding group filters.
                  </div>
                ) : (
                  donors.map((donor) => (
                    <div
                      key={donor._id}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 hover:border-red-200 transition duration-150 flex justify-between items-start"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="h-7 w-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                            {donor.bloodGroup}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 flex items-center">
                              <span>{donor.name}</span>
                              {donor.isVerified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600 fill-green-50 ml-1.5" title="Verified Donor" />
                              )}
                            </h4>
                            <p className="text-xxs text-gray-400">
                              {donor.city}, {donor.pincode}
                            </p>
                          </div>
                        </div>
                        
                        {donor.lastDonationDate ? (
                          <p className="text-xxs text-gray-500 font-medium">
                            Last Donation: {new Date(donor.lastDonationDate).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xxs text-gray-400 italic">No recent donation logged</p>
                        )}
                      </div>

                      <div className="text-right space-y-1">
                        {donor.distance !== null ? (
                          <span className="inline-block bg-red-50 text-red-700 font-extrabold text-xxs px-2.5 py-1 rounded-full border border-red-100">
                            {donor.distance} km away
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-50 text-gray-600 font-bold text-xxs px-2.5 py-1 rounded-full">
                            City Area
                          </span>
                        )}

                        <a
                          href={`tel:${donor.phone}`}
                          className="flex items-center justify-end text-xxs text-gray-500 hover:text-red-600 font-semibold pt-1"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{donor.phone}</span>
                        </a>
                      </div>
                    </div>
                  ))
                )
              ) : (
                bloodBanks.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-150 text-center text-gray-400 text-sm">
                    No matching blood banks found with this group in stock.
                  </div>
                ) : (
                  bloodBanks.map((bank) => {
                    const groupStock = bank.inventory.find(i => i.bloodGroup === (bloodGroup || 'O+'));
                    const unitsCount = groupStock ? groupStock.units : 0;

                    return (
                      <div
                        key={bank._id}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 hover:border-red-200 transition duration-150 flex justify-between items-start"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="h-7 w-7 bg-red-800 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              🏦
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-gray-800 flex items-center">
                                <span>{bank.name}</span>
                                {bank.isVerified && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-green-600 fill-green-50 ml-1.5" title="Verified Blood Bank" />
                                )}
                              </h4>
                              <p className="text-xxs text-gray-400">
                                {bank.address}, {bank.city}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xxs text-red-600 font-extrabold">
                            In Stock: {unitsCount} units of {bloodGroup || 'O+'}
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          {bank.distance !== null ? (
                            <span className="inline-block bg-red-50 text-red-700 font-extrabold text-xxs px-2.5 py-1 rounded-full border border-red-100">
                              {bank.distance} km away
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-50 text-gray-600 font-bold text-xxs px-2.5 py-1 rounded-full">
                              City Area
                            </span>
                          )}

                          <a
                            href={`tel:${bank.phone}`}
                            className="flex items-center justify-end text-xxs text-gray-500 hover:text-red-600 font-semibold pt-1"
                          >
                            <Phone className="h-3 w-3 mr-1" />
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
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 shadow-sm border border-gray-150 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700 px-1">
            <span className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>Donor Geospatial Map</span>
            </span>
            <span className="text-xxs text-gray-400 font-normal italic">
              * Click map to adjust search center
            </span>
          </div>

          <div className="h-[44rem] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-10">
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
                    <p className="font-bold text-blue-600">Search Reference Center</p>
                    <p className="text-xxs text-gray-400">
                      Latitude: {reqCoords.lat.toFixed(4)}<br />
                      Longitude: {reqCoords.lng.toFixed(4)}
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
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1">
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold text-xxs">
                            {donor.bloodGroup}
                          </span>
                          <span className="font-bold text-gray-800">{donor.name}</span>
                        </div>
                        <p className="text-xxs text-gray-500">Contact: {donor.phone}</p>
                        {donor.distance !== null && (
                          <p className="text-xxs text-red-600 font-bold">
                            Distance: {donor.distance} km
                          </p>
                        )}
                        <p className="text-xxs text-gray-400">City: {donor.city}</p>
                        <a
                          href={`tel:${donor.phone}`}
                          className="mt-1.5 block w-full bg-red-600 hover:bg-red-700 text-white text-center font-bold py-1 rounded text-xxs transition duration-150"
                        >
                          Call Now
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
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1">
                          <span className="bg-red-800 text-white px-1.5 py-0.5 rounded font-bold text-xxs">
                            🏦
                          </span>
                          <span className="font-bold text-gray-800">{bank.name}</span>
                        </div>
                        <p className="text-xxs font-extrabold text-red-600">
                          In Stock: {unitsCount} units of {bloodGroup || 'O+'}
                        </p>
                        <p className="text-xxs text-gray-500">Address: {bank.address}, {bank.city}</p>
                        {bank.distance !== null && (
                          <p className="text-xxs text-gray-600 font-bold">
                            Distance: {bank.distance} km
                          </p>
                        )}
                        <a
                          href={`tel:${bank.phone}`}
                          className="mt-1.5 block w-full bg-gray-900 hover:bg-gray-800 text-white text-center font-bold py-1 rounded text-xxs transition duration-150"
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
