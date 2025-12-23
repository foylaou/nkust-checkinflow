/**
 * 活動位置地圖組件
 * 顯示活動位置和使用者當前位置
 */
import { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface EventLocationMapProps {
  eventLatitude: number;
  eventLongitude: number;
  radius: number;
  userLatitude?: number;
  userLongitude?: number;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

export default function EventLocationMap({
  eventLatitude,
  eventLongitude,
  radius,
  userLatitude,
  userLongitude
}: EventLocationMapProps) {
  const [center, setCenter] = useState({ lat: eventLatitude, lng: eventLongitude });
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: libraries
  });

  useEffect(() => {
    // 如果有使用者位置，計算中心點（活動位置和使用者位置的中間）
    if (userLatitude && userLongitude) {
      const midLat = (eventLatitude + userLatitude) / 2;
      const midLng = (eventLongitude + userLongitude) / 2;
      setCenter({ lat: midLat, lng: midLng });
    } else {
      setCenter({ lat: eventLatitude, lng: eventLongitude });
    }
  }, [eventLatitude, eventLongitude, userLatitude, userLongitude]);

  if (!apiKey) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
        <p className="font-medium">Google Maps API Key 未設定</p>
        <p className="text-sm mt-1">
          請在 .env.development 檔案中設定 VITE_GOOGLE_MAPS_API_KEY
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        <p className="font-medium">地圖載入失敗</p>
        <p className="text-sm mt-1">請稍後再試或檢查網路連線</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-gray-600">載入地圖中...</p>
          </div>
        </div>
      </div>
    );
  }

  const eventPosition = { lat: eventLatitude, lng: eventLongitude };
  const userPosition = userLatitude && userLongitude
    ? { lat: userLatitude, lng: userLongitude }
    : null;

  // 計算是否在範圍內
  const isInRange = userPosition ? calculateDistance(
    eventLatitude,
    eventLongitude,
    userLatitude!,
    userLongitude!
  ) <= radius : false;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">位置資訊</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p>📍 活動位置已標記於地圖上</p>
          {userPosition && (
            <>
              <p>📱 您的位置已標記於地圖上</p>
              <p className={isInRange ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                {isInRange
                  ? '✓ 您在簽到範圍內'
                  : `✗ 您不在簽到範圍內 (需在 ${radius}m 內)`}
              </p>
            </>
          )}
          {!userPosition && (
            <p className="text-orange-700">⚠️ 正在獲取您的位置...</p>
          )}
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {/* 活動位置標記 */}
        <Marker
          position={eventPosition}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }}
          title="活動位置"
        />

        {/* 簽到範圍圓圈 */}
        <Circle
          center={eventPosition}
          radius={radius}
          options={{
            fillColor: '#4F46E5',
            fillOpacity: 0.2,
            strokeColor: '#4F46E5',
            strokeOpacity: 0.8,
            strokeWeight: 2
          }}
        />

        {/* 使用者位置標記 */}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }}
            title="您的位置"
          />
        )}
      </GoogleMap>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>活動位置</span>
        </div>
        {userPosition && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>您的位置</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-indigo-500 opacity-20 border-2 border-indigo-500"></div>
          <span>簽到範圍 ({radius}m)</span>
        </div>
      </div>
    </div>
  );
}

// 計算兩點之間的距離（米）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 地球半徑（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距離（米）
}
