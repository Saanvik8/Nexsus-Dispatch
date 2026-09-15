import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths in React/Vite builds
const customTruckPin = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="
    width: 14px; 
    height: 14px; 
    background-color: #38bdf8; 
    border: 2px solid #0f172a; 
    border-radius: 50%; 
    box-shadow: 0 0 10px #38bdf8;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Helper component to smoothly center map on vehicle click
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 8, { duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function FleetMap({ vehicle }) {
  const lat = vehicle?.telemetry?.lat || 19.0760;
  const lng = vehicle?.telemetry?.long || 72.8777;

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-[#1E2638] relative">
      <MapContainer
        center={[lat, lng]}
        zoom={7}
        scrollWheelZoom={false}
        attributionControl={false}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter free map tiles */}
        <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
        <RecenterMap lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={customTruckPin}>
          <Popup className="text-xs font-mono">
            {vehicle?.vehicleId} — {vehicle?.destination}
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Floating Coordinate Pill */}
      <div className="absolute bottom-2 left-2 z-[400] bg-[#0B0F17]/90 backdrop-blur border border-[#1E2638] px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
        LAT: {lat.toFixed(4)} | LNG: {lng.toFixed(4)}
      </div>
    </div>
  );
}