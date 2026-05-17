import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Truck, MapPin, CheckCircle2, Factory, Clock, User } from 'lucide-react';
import { renderToString } from 'react-dom/server';

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

// Create custom icons for different event types
const createCustomIcon = (color, index) => {
  const iconSvg = `
    <div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
      border: 3px solid white;
    ">${index + 1}</div>
  `;
  
  return L.divIcon({
    html: iconSvg,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const JourneyMap = ({ timeline }) => {
  // Coordinates mapping for Vietnamese locations
  const locationCoords = {
    // Airports
    "Nội Bài": [21.2187, 105.8042],
    "Tân Sơn Nhất": [10.8185, 106.6588],
    "Đà Nẵng": [16.0471, 108.1978],
    "Cam Ranh": [11.9977, 109.2186],
    "Phú Quốc": [10.1720, 103.9800],
    "Vinh": [18.7350, 105.6700],
    
    // Major cities
    "Hà Nội": [21.0285, 105.8542],
    "Hồ Chí Minh": [10.8231, 106.6297],
    "TP. Hồ Chí Minh": [10.8231, 106.6297],
    "Thành phố Hồ Chí Minh": [10.8231, 106.6297],
    "Đà Nẵng": [16.0544, 108.2022],
    "Hải Phòng": [20.8449, 106.6881],
    "Cần Thơ": [10.0371, 105.7882],
    "Nha Trang": [12.2388, 109.1967],
    "Quy Nhơn": [13.7794, 109.2233],
    "Huế": [16.4664, 107.5823],
    "Vũng Tàu": [10.3450, 107.0840],
    "Đà Lạt": [11.9408, 108.4372],
    "Biên Hòa": [10.9500, 106.8167],
    "Vĩnh Yên": [21.3100, 105.5700],
    "Thái Nguyên": [21.5922, 105.8437],
    "Bắc Ninh": [21.1868, 106.0778],
    "Nam Định": [20.4200, 106.1700],
    "Thanh Hóa": [19.8100, 105.7800],
    "Hà Tĩnh": [18.3400, 105.9000],
    "Quảng Bình": [17.4700, 106.6000],
    "Quảng Trị": [16.7500, 107.1800],
    "Quảng Nam": [15.8800, 108.3300],
    "Kon Tum": [14.3500, 108.0000],
    "Pleiku": [13.9800, 108.0000],
    "Buôn Ma Thuột": [12.6700, 108.0500],
    "Tây Ninh": [11.3000, 106.1000],
    "Bình Dương": [10.9700, 106.6700],
    "Đồng Nai": [10.9300, 106.8500],
    "Bà Rịa - Vũng Tàu": [10.5000, 107.0700],
    "Bến Tre": [10.2300, 106.3800],
    "Trà Vinh": [9.9300, 106.3500],
    "Vĩnh Long": [10.2500, 105.9700],
    "Đồng Tháp": [10.4600, 105.6200],
    "An Giang": [10.5200, 105.1300],
    "Kiên Giang": [10.0200, 105.0800],
    "Sóc Trăng": [9.6000, 105.9800],
    "Bạc Liêu": [9.2800, 105.7300],
    "Cà Mau": [9.1800, 105.1500],
    "Lạng Sơn": [21.8400, 106.7600],
    "Cao Bằng": [22.6700, 106.2500],
    "Bắc Kạn": [22.1400, 105.8300],
    "Hà Giang": [22.8300, 104.9800],
    "Lào Cai": [22.4900, 103.9500],
    "Yên Bái": [21.7100, 104.8700],
    "Sơn La": [21.3200, 103.9100],
    "Phú Thọ": [21.4000, 105.2300],
    "Hòa Bình": [20.8200, 105.3400],
    "Ninh Bình": [20.2500, 105.9700],
    "Hà Nam": [20.5800, 105.9300],
    "Hưng Yên": [20.6500, 106.0700],
    "Hải Dương": [20.9400, 106.3200],
    "Quảng Ninh": [20.9600, 107.0600],
    
    // Districts and wards in HCM and HN
    "Quận 1": [10.7756, 106.7000],
    "Quận 2": [10.7900, 106.7600],
    "Quận 3": [10.7800, 106.6850],
    "Quận 4": [10.7600, 106.7000],
    "Quận 5": [10.7550, 106.6650],
    "Quận 6": [10.7400, 106.6300],
    "Quận 7": [10.7300, 106.7200],
    "Quận 8": [10.7200, 106.6400],
    "Quận 9": [10.8400, 106.8200],
    "Quận 10": [10.7650, 106.6550],
    "Quận 11": [10.7500, 106.6400],
    "Quận 12": [10.8600, 106.6300],
    "Thủ Đức": [10.8410, 106.7590],
    "Gò Vấp": [10.8330, 106.6600],
    "Bình Thạnh": [10.8000, 106.6900],
    "Tân Bình": [10.8000, 106.6500],
    "Phú Nhuận": [10.7900, 106.6700],
    "Tân Phú": [10.7800, 106.6200],
    "Bình Tân": [10.7400, 106.6000],
    "Hóc Môn": [10.8800, 106.5900],
    "Củ Chi": [10.9800, 106.4600],
    "Nhà Bè": [10.7000, 106.7500],
    "Cần Giờ": [10.4800, 106.9600],
    
    "Ba Đình": [21.0333, 105.8333],
    "Đống Đa": [21.0167, 105.8333],
    "Cầu Giấy": [21.0333, 105.7833],
    "Nam Từ Liêm": [21.0167, 105.7667],
    "Bắc Từ Liêm": [21.0500, 105.7333],
    "Hà Đông": [20.9667, 105.7833],
    "Hoàng Mai": [20.9833, 105.8667],
    "Thanh Xuân": [21.0000, 105.8167],
    "Tây Hồ": [21.0667, 105.8167],
    "Long Biên": [21.0333, 105.9167],
    "Gia Lâm": [21.0167, 105.9500],
    "Đông Anh": [21.1500, 105.8333],
    "Sóc Sơn": [21.2833, 105.7333],
    "Mê Linh": [21.1667, 105.6333],
    "Đan Phượng": [21.0500, 105.6333],
    "Hoài Đức": [21.0333, 105.5833],
    "Quốc Oai": [21.0000, 105.5333],
    "Thạch Thất": [21.0167, 105.4833],
    "Ba Vì": [21.2000, 105.3833],
    "Phúc Thọ": [21.1333, 105.4833],
    "Sơn Tây": [21.1333, 105.5167],
    
    // Specific companies
    "ADC": [10.0357, 105.7797],
    "COSMECCA KOREA": [37.0315, 127.1764],
    "Long Châu": [20.8354, 106.6796],
    "Hương Giang": [20.8510, 106.6827],
    "Dược phẩm Nam Hà": [20.9166, 105.8496],
    "Dược phẩm Hải Linh":[21.1330, 106.3830],
    "Dược Quốc Tế Việt Pháp":[20.8553856, 106.6852148],
    "Kho Dược Quốc Tế An Việt HP":[20.846553, 106.6553992],
    "Việt Pháp Pharma":[20.861867, 106.6927154],
    "XL Laboratories Private Limited": [28.6519, 77.1363],
    "Dược phẩm GSK Việt Nam": [10.7773, 106.7035],
    "Phil Inter Pharma" :[10.9097, 106.7139],

    // Famous landmarks
    "Hạ Long": [20.9575, 107.0431],
    "Sapa": [22.3380, 103.8300],
    "Mũi Né": [10.9500, 108.2700],
    "Sa Pa": [22.3380, 103.8300],
  };

  const getCoords = (description) => {
    if (!description) return null;
    const descLower = description.toLowerCase();
    
    for (const key in locationCoords) {
      if (descLower.includes(key.toLowerCase())) return locationCoords[key];
    }
    
    // Fallback coordinates for Vietnam regions
    if (descLower.includes("miền bắc") || descLower.includes("miền bắc")) return [21.0285, 105.8542];
    if (descLower.includes("miền trung")) return [16.0544, 108.2022];
    if (descLower.includes("miền nam")) return [10.8231, 106.6297];
    
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
  const center = markers.length > 0 ? markers[markers.length - 1].coords : [14.0583, 108.2772]; // Center of Vietnam

  // Color palette for markers - more vibrant
  const markerColors = [
    '#dc2626', // bright red
    '#ea580c', // bright orange
    '#ca8a04', // bright yellow
    '#16a34a', // bright green
    '#0891b2', // bright cyan
    '#2563eb', // bright blue
    '#7c3aed', // bright purple
    '#db2777', // bright pink
  ];

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <MapContainer 
        center={center} 
        zoom={markers.length > 1 ? 6 : 10} 
        style={{ height: '100%', width: '100%', }}
      >
        {/* Use a more detailed tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {markers.map((marker, idx) => (
          <Marker 
            key={idx} 
            position={marker.coords}
            icon={createCustomIcon(markerColors[idx % markerColors.length], idx)}
          >
            <Tooltip direction="top" offset={[0, -36]} opacity={1} permanent={false}>
              <div className="font-bold text-sm px-1">
                Bước {idx + 1}
              </div>
            </Tooltip>
            <Popup>
              <div className="font-sans min-w-[220px]">
                <div className="flex items-start gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold`}
                       style={{ backgroundColor: markerColors[idx % markerColors.length] }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{marker.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock size={12} className="text-gray-400" />
                    {new Date(Number(marker.timestamp) * 1000).toLocaleString('vi-VN')}
                  </div>
                  
                  {marker.actor && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User size={12} className="text-gray-400" />
                      <span className="font-mono text-[10px] break-all">
                        {marker.actor.slice(0, 10)}...{marker.actor.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {markers.length > 1 && (
          <>
            <Polyline 
              positions={markers.map(m => m.coords)} 
              color="#3b82f6" 
              weight={4} 
              opacity={0.8}
              smoothFactor={1.0}
            />
            {/* Arrow markers indicating direction */}
            {markers.slice(0, -1).map((marker, idx) => {
              const nextMarker = markers[idx + 1];
              const midPoint = [
                (marker.coords[0] + nextMarker.coords[0]) / 2,
                (marker.coords[1] + nextMarker.coords[1]) / 2
              ];
              return (
                <Marker key={`arrow-${idx}`} position={midPoint}>
                  <Popup>
                    <div className="font-sans text-center">
                      <p className="font-bold text-xs text-gray-500">
                        Bước {idx + 1} → {idx + 2}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default JourneyMap;
