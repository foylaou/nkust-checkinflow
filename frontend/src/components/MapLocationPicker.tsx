/**
 * 地圖位置選擇器組件
 * 使用 Google Maps API 選擇活動位置和設定簽到範圍
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle, Autocomplete } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  radius?: number;
  locationName?: string; // 活動地點名稱，用於初始搜尋
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

// 台灣預設中心點（台北市）
const defaultCenter = {
  lat: 25.0330,
  lng: 121.5654
};

export default function MapLocationPicker({
  latitude,
  longitude,
  radius = 100,
  locationName,
  onLocationChange,
  onRadiusChange
}: MapLocationPickerProps) {
  const [center, setCenter] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState(locationName || '');
  const [searchError, setSearchError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: libraries
  });

  // 當外部 latitude/longitude 改變時更新地圖
  useEffect(() => {
    if (latitude && longitude) {
      const newPos = { lat: latitude, lng: longitude };
      setCenter(newPos);
      setMarkerPosition(newPos);
    }
  }, [latitude, longitude]);

  // 當 locationName 改變時更新搜尋框
  useEffect(() => {
    if (locationName && locationName !== searchValue) {
      setSearchValue(locationName);
    }
  }, [locationName]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newPos = { lat, lng };
        setMarkerPosition(newPos);
        setCenter(newPos);
        onLocationChange(lat, lng);
      }
    },
    [onLocationChange]
  );

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value);
    onRadiusChange(newRadius);
  };

  const onLoadAutocomplete = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      // 檢查 place 對象是否有效
      if (!place || !place.geometry || !place.geometry.location) {
        setSearchError('請從下拉列表中選擇一個地點');
        setTimeout(() => setSearchError(null), 3000);
        return;
      }

      // 清除錯誤並更新位置
      setSearchError(null);
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPos = { lat, lng };
      setMarkerPosition(newPos);
      setCenter(newPos);
      onLocationChange(lat, lng);
      setSearchValue(place.formatted_address || place.name || '');
    }
  }, [onLocationChange]);

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          搜尋或點擊地圖選擇活動位置
        </label>
        <div className="relative">
          <Autocomplete
            onLoad={onLoadAutocomplete}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: "tw" },
              fields: ["address_components", "geometry", "formatted_address", "name"]
            }}
          >
            <input
              type="text"
              placeholder="搜尋地點（例如：台北101、高雄85大樓）"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setSearchError(null);
              }}
              className={`w-full px-4 py-2 mb-2 border rounded-md focus:outline-none focus:ring-2 ${
                searchError
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </Autocomplete>
          {searchError && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              ⚠️ {searchError}
            </div>
          )}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {markerPosition && (
              <>
                <Marker position={markerPosition} />
                <Circle
                  center={markerPosition}
                  radius={radius}
                  options={{
                    fillColor: '#4F46E5',
                    fillOpacity: 0.2,
                    strokeColor: '#4F46E5',
                    strokeOpacity: 0.8,
                    strokeWeight: 2
                  }}
                />
              </>
            )}
          </GoogleMap>
        </div>
      </div>

      {markerPosition && (
        <div className="bg-blue-50 p-3 rounded-md text-sm">
          <p className="font-medium text-blue-900">已選擇位置：</p>
          <p className="text-blue-700">
            緯度: {markerPosition.lat.toFixed(6)}, 經度: {markerPosition.lng.toFixed(6)}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          簽到範圍半徑：{radius} 公尺
        </label>
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10m</span>
          <span>250m</span>
          <span>500m</span>
        </div>
      </div>
    </div>
  );
}
