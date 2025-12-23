// src/utils/locationUtils.ts

/**
 * 獲取用戶的地理位置
 * @returns {Promise<{ latitude: number, longitude: number } | null>} 緯度和經度，如果獲取失敗則返回 null
 */
export async function getGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser.');
      return resolve(null);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        // 可以根據錯誤類型提供更詳細的處理
        // error.code:
        //   1: PERMISSION_DENIED
        //   2: POSITION_UNAVAILABLE
        //   3: TIMEOUT
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}