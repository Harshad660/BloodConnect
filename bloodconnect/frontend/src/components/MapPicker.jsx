import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Red icon for SOS/requester/emergency
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom component to handle map click events
const LocationMarker = ({ position, setPosition, onChange }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onChange({ lat, lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={redIcon} />
  );
};

// Component to dynamically pan the map when external position updates
const MapController = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapPicker = ({ onChange, initialLat, initialLng }) => {
  const [position, setPosition] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Initialize position
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([parseFloat(initialLat), parseFloat(initialLng)]);
    } else {
      // Fallback default coordinates (e.g. Bangalore center)
      setPosition([12.9716, 77.5946]);
    }
  }, [initialLat, initialLng]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        onChange({ lat: latitude, lng: longitude });
        setLoadingLoc(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not detect location. Please select it manually on the map.');
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-1">
          <MapPin className="h-4 w-4 text-red-600" />
          <span>Select Location on Map *</span>
        </label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={loadingLoc}
          className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 transition duration-150 disabled:opacity-50"
        >
          <Navigation className={`h-3 w-3 ${loadingLoc ? 'animate-spin' : ''}`} />
          <span>{loadingLoc ? 'Detecting...' : 'Detect My Location'}</span>
        </button>
      </div>

      <div className="h-64 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-10">
        {position && (
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
            <MapController center={position} />
          </MapContainer>
        )}
      </div>
      <p className="text-xxs text-gray-500 italic">
        * Drag the map and click/tap anywhere to set your exact coordinate pins.
      </p>
    </div>
  );
};

export default MapPicker;
