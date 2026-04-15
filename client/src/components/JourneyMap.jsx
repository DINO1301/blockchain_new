import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon issue in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const JourneyMap = ({ timeline }) => {
  // Coordinates mapping for some common locations (mock data for now)
  // In a real app, these should come from the timeline events or a database
  const locationCoords = {
    "Noi Bai": [21.2187, 105.8042],
    "Tan Son Nhat": [10.8185, 106.6588],
    "ADC": [10.0357, 105.7797],
    "COSMECCA KOREA": [37.0315, 127.1764], // Chungcheongbuk-do, Korea (Headquarters)
    "Hà Nội": [21.0285, 105.8542],
    "Hồ Chí Minh": [10.8231, 106.6297],
    "Cần Thơ": [10.0371, 105.7882],
    "Đà Nẵng": [16.0544, 108.2022],
    "Hải Phòng": [20.8449, 106.6881],
    "Long Châu": [20.8354, 106.6796],
    "Dược phẩm Nam Hà": [20.9166, 105.8496],
  };

  const getCoords = (description) => {
    if (!description) return null;
    const descLower = description.toLowerCase();
    
    for (const key in locationCoords) {
      if (descLower.includes(key.toLowerCase())) return locationCoords[key];
    }
    return null;
  };

  const markers = timeline
    .map(event => ({
      coords: getCoords(event.description),
      description: event.description,
      timestamp: event.timestamp,
      actor: event.actor
    }))
    .filter(marker => marker.coords !== null);

  // Center map on the latest event or a default location
  const center = markers.length > 0 ? markers[0].coords : [15.8, 105.8]; // Central Vietnam

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <MapContainer 
        center={center} 
        zoom={markers.length > 1 ? 5 : 12} 
        style={{ height: '100%', width: '100%', }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.coords}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-sm mb-1">{marker.description}</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(Number(marker.timestamp) * 1000).toLocaleString('vi-VN')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {markers.length > 1 && (
          <Polyline 
            positions={markers.map(m => m.coords)} 
            color="#3b82f6" 
            weight={3} 
            opacity={0.6}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default JourneyMap;
