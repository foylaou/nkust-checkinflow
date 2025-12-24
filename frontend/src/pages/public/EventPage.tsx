/**
 * 活動簽到頁面
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { checkinService } from '../../services/checkinService';
import { userService } from '../../services/userService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EventDetails from '../../components/EventDetails';
import CheckinForm from '../../components/CheckinForm';
import LineLoginButton from '../../components/LineLoginButton';
import CheckinResult from '../../components/CheckinResult';
import EventLocationMap from '../../components/EventLocationMap';
import CheckinRecord from '../../components/CheckinRecord';
import { isEventActive } from '../../utils/eventUtils';
import { getGeolocation } from '../../utils/locationUtils';
import type {User, Event, RegistrationTemplate, CheckinCreate, Checkin} from "../../types";

// Helper to manage user token in localStorage for public pages
const USER_TOKEN_KEY = 'line_access_token';
const USER_ID_KEY = 'current_user_id';

export default function EventPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null);
  const [isCheckinAvailable, setIsCheckinAvailable] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);
  const [_checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<string | null>(null);
  const [currentCheckin, setCurrentCheckin] = useState<Checkin | null>(null);
  const [lastActionWasCheckout, setLastActionWasCheckout] = useState(false);
  const hasProcessedUrlParams = useRef(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


  useEffect(() => {
    if (!eventId) {
      setError('無效的活動 ID');
      setLoading(false);
      return;
    }

    const initPage = async () => {
      setLoading(true);
      try {
        const eventResponse = await eventService.getEvent(eventId);
        setEvent(eventResponse);

        // 檢查 URL 中的 token 和 user ID (只處理一次)
        const tokenFromUrl = searchParams.get('token');
        const userIdFromUrl = searchParams.get('sub');

        if (tokenFromUrl && userIdFromUrl && !hasProcessedUrlParams.current) {
          hasProcessedUrlParams.current = true;
          localStorage.setItem(USER_TOKEN_KEY, tokenFromUrl);
          localStorage.setItem(USER_ID_KEY, userIdFromUrl);
          // 清除 URL 參數
          navigate(`/event/${eventId}`, { replace: true });
          return; // 返回，等待下次 useEffect 重新初始化
        }

        const storedToken = localStorage.getItem(USER_TOKEN_KEY);
        const storedUserId = localStorage.getItem(USER_ID_KEY);

        if (storedToken && storedUserId) {
          // 嘗試獲取用戶資訊
          try {
            // Need a way to set user token in apiClient for user requests
            // For simplicity, directly fetch user here, future might extend apiClient for user-tokens
            const currentUser = await userService.getUser(parseInt(storedUserId)); // This will need admin token or public user info route. Assuming it's public.
            setUser(currentUser);
            // After getting user, validate checkin
            await validateAndSetCheckinAvailability(eventResponse, currentUser, storedToken);
          } catch (userError: any) {
            console.error("Failed to fetch user info with token:", userError);
            localStorage.removeItem(USER_TOKEN_KEY);
            localStorage.removeItem(USER_ID_KEY);
            setUser(null);
            setError("用戶身份驗證失敗，請重新登入。");
          }
        } else {
          // 未登入狀態
          setUser(null);
          // 也可以在這裡設定 isCheckinAvailable 為 false
          setIsCheckinAvailable(false);
        }

        // 嘗試獲取地理位置
        if (eventResponse.location_validation) {
          const coords = await getGeolocation(); // getGeolocation should handle permissions/errors
          if (coords) {
            setGeoData(`${coords.latitude},${coords.longitude}`);
          } else {
            // 如果需要位置驗證但獲取失敗，可以顯示錯誤
            setError(prev => prev ? prev + " 無法獲取地理位置，簽到可能受影響。" : "無法獲取地理位置，簽到可能受影響。");
          }
        }

      } catch (err: any) {
        console.error("Error initializing EventPage:", err);
        setError(err.response?.data?.detail || '無法加載活動詳情');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [eventId, searchParams]);

  // Validate checkin availability
  const validateAndSetCheckinAvailability = async (currentEvent: Event, currentUser: User, token: string) => {
      if (!currentEvent || !currentUser || !token) {
          setIsCheckinAvailable(false);
          return;
      }

      try {
          const validateResponse = await checkinService.validateCheckin({
              user_id: currentUser.id,
              event_id: currentEvent.id
          });

          // 保存當前的簽到記錄
          if (validateResponse.checkin) {
              setCurrentCheckin(validateResponse.checkin);
          }

          // 根據驗證消息判斷狀態
          const message = validateResponse.message;

          if (message.includes("已完成簽到退") || message.includes("已完成簽到和簽退")) {
              setHasCheckedIn(true);
              setHasCheckedOut(true);
              setIsCheckinAvailable(false);
              setCanCheckout(false);
          } else if (message.includes("可以進行簽退") || (message.includes("簽退") && message.includes("可以"))) {
              // 可以簽退
              setHasCheckedIn(true);
              setHasCheckedOut(false);
              setIsCheckinAvailable(false);
              setCanCheckout(true);
          } else if (message.includes("還需等待") || (message.includes("簽退") && message.includes("分鐘"))) {
              // 已簽到但還不能簽退
              setHasCheckedIn(true);
              setHasCheckedOut(false);
              setIsCheckinAvailable(false);
              setCanCheckout(false);
          } else if (message.includes("可以進行簽到") || message.includes("簽到")) {
              // 可以進行簽到
              setHasCheckedIn(false);
              setHasCheckedOut(false);
              setIsCheckinAvailable(validateResponse.valid);
              setCanCheckout(false);
          }

          if (!validateResponse.valid) {
              setCheckinMessage(validateResponse.message);
          }
      } catch (validationError: any) {
          console.error("Checkin validation failed:", validationError);
          setIsCheckinAvailable(false);
          setCheckinMessage("簽到資格驗證失敗。");
      }
  };


  const handleLineLogin = () => {
    // 構建 LINE 登入 URL
    const redirectUri = encodeURIComponent(`${apiBaseUrl}/api/auth/line/callback`);
    const state = eventId; // 使用 eventId 作為 state 參數
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CHANNEL_ID}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid&nonce=${Math.random().toString(36).substring(2, 15)}`;
    window.location.href = lineAuthUrl;
  };

  const handleLogout = () => {
    // 清除所有 token
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    // 重新載入頁面
    window.location.reload();
  };

  // 組合當前需要的表單欄位
  const getCombinedTemplate = (action: 'checkin' | 'checkout'): RegistrationTemplate | null => {
    if (!event) return null;

    // 使用 event.templates 中的所有相關範本
    const allTemplates = event.templates || [];
    const combinedFields: any[] = [];

    if (action === 'checkout') {
      // 結課問卷
      const endSurveys = allTemplates.filter(t => t.type === 'survey' && t.survey_trigger === 'course_end');
      endSurveys.forEach(t => combinedFields.push(...t.fields_schema));
    } else {
      // 簽到時：組合 註冊 + 開始調查 + 基本資料擴充
      
      // 1. 註冊表單
      const regTemplates = allTemplates.filter(t => t.type === 'registration');
      regTemplates.forEach(t => combinedFields.push(...t.fields_schema));
      
      // 2. 開始調查
      const startSurveys = allTemplates.filter(t => t.type === 'survey' && t.survey_trigger === 'course_start');
      startSurveys.forEach(t => combinedFields.push(...t.fields_schema));
      
      // 3. 基本資料擴充 (如果使用者還沒填過這些欄位)
      const profileTemplates = allTemplates.filter(t => t.type === 'profile_extension');
      if (user) {
        const userProfile = user.profile_data || {};
        profileTemplates.forEach(t => {
          const missingFields = t.fields_schema.filter(
            field => userProfile[field.name] === undefined || userProfile[field.name] === ''
          );
          combinedFields.push(...missingFields);
        });
      } else {
        profileTemplates.forEach(t => combinedFields.push(...t.fields_schema));
      }
    }

    if (combinedFields.length === 0) return null;

    return {
      id: 'combined',
      name: '合併表單',
      type: 'registration',
      fields_schema: combinedFields,
      is_public: false,
      created_at: ''
    } as RegistrationTemplate;
  };

  const handleCheckin = async (dynamicData?: Record<string, any>) => {
    if (!event || !user) {
      setError('活動或用戶信息不完整');
      return;
    }

    setCheckinStatus('loading');
    setError(null);
    setCheckinMessage(null);
    setCheckoutMessage(null);

    try {
        // 分離 profile_data
        let profile_data: Record<string, any> | undefined = undefined;
        let actual_dynamic_data = dynamicData;

        const allTemplates = event.templates || [];
        const profileTemplates = allTemplates.filter(t => t.type === 'profile_extension');

        if (dynamicData && profileTemplates.length > 0) {
          profile_data = {};
          actual_dynamic_data = { ...dynamicData };
          
          profileTemplates.forEach(t => {
            t.fields_schema.forEach(field => {
              if (dynamicData[field.name] !== undefined) {
                profile_data![field.name] = dynamicData[field.name];
              }
            });
          });

          if (Object.keys(profile_data).length === 0) profile_data = undefined;
        }

        const checkinData: CheckinCreate = {
            user_id: user.id,
            event_id: event.id,
            geolocation: geoData || undefined,
            dynamic_data: actual_dynamic_data,
            profile_data: profile_data
        };
        const response = await checkinService.createCheckin(checkinData);

        // 判斷是簽到還是簽退
        const isCheckout = Boolean(response.checkin?.checkout_time) || response.checkin?.status === '已簽退';

        console.log('Checkin response:', response.checkin);
        console.log('Is checkout:', isCheckout);
        console.log('Checkout time:', response.checkin?.checkout_time);

        // 保存簽到記錄
        if (response.checkin) {
            setCurrentCheckin(response.checkin);
        }

        // 先更新 lastActionWasCheckout，再設置 success 狀態
        if (isCheckout) {
            setHasCheckedOut(true);
            setCanCheckout(false);
            setLastActionWasCheckout(true);
            setCheckinMessage("簽退成功！");
            // 使用 setTimeout 確保狀態更新後再觸發成功頁面
            setTimeout(() => setCheckinStatus('success'), 0);
        } else {
            setHasCheckedIn(true);
            setLastActionWasCheckout(false);
            setCheckinMessage("簽到成功！");
            // 如果活動需要簽退，設置可簽退狀態
            if (event.require_checkout) {
                setCanCheckout(true);
            }
            setTimeout(() => setCheckinStatus('success'), 0);
        }
    } catch (err: any) {
        console.error("Checkin error:", err);
        setCheckinStatus('error');
        const detail = err.response?.data?.detail;
        setCheckinMessage(detail || "操作失敗，請重試");
        if (detail && detail.includes("還需等待")) {
            setCheckoutMessage(detail);
        }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!event) {
    return <ErrorMessage message="活動不存在" />;
  }

  const eventIsActive = isEventActive(event);

  // 解析使用者位置（未登入時也可能獲取到）
  const userCoordsForGuest = geoData ? {
    lat: parseFloat(geoData.split(',')[0]),
    lng: parseFloat(geoData.split(',')[1])
  } : null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-center mb-6">{event.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <EventDetails
              startTime={event.start_time}
              endTime={event.end_time}
              location={event.location || '未指定'}
              requiresLocation={
              event.location_validation &&
              event.latitude != null &&
              event.longitude != null
            }
              isAvailable={eventIsActive}
            />

            {event.description && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">活動描述</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            <LineLoginButton onLogin={handleLineLogin} className="mt-8" />
            <p className="text-center text-sm text-gray-500 mt-4">
              請先登入 LINE 帳號以進行簽到。
            </p>
          </div>

          {/* 地圖顯示 - 當需要位置驗證且有活動位置時 */}
          {event.location_validation && event.latitude && event.longitude && (
            <div className="lg:col-span-1">
              <EventLocationMap
                eventLatitude={event.latitude}
                eventLongitude={event.longitude}
                radius={event.radius || 100}
                userLatitude={userCoordsForGuest?.lat}
                userLongitude={userCoordsForGuest?.lng}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (checkinStatus === 'success') {
      return (
          <CheckinResult
              status="success"
              title={lastActionWasCheckout ? "簽退成功" : "簽到成功"}
              message={`您已成功${lastActionWasCheckout ? "簽退" : "簽到"}「${event.name}」活動`}
              userName={user.name}
              time={new Date().toLocaleString()}
          />
      );
  }

  if (checkinStatus === 'error') {
      // 如果是位置錯誤等嚴重錯誤，可以選擇顯示結果頁面，或者保留在表單頁面顯示錯誤提示
      // 這裡示範如果是嚴重錯誤跳轉結果頁，如果是普通錯誤留在原頁
      // 暫時保持在原頁面顯示錯誤，但如果用戶想看明確的失敗頁面，可以切換
      // 為了回應需求 "缺少簽到結果頁面"，這裡我們對於特定錯誤展示結果頁面
      // 或者簡單地，當 checkinStatus 為 error 時渲染結果頁
      
      // 但通常保留在表單頁讓用戶重試體驗比較好。
      // 這裡僅在嚴重錯誤或明確失敗後不允許重試時使用結果頁。
      // 為了滿足用戶 "缺少簽到結果頁面" 的感覺，我們可以在表單上方顯示錯誤，
      // 或者如果錯誤是 "不在範圍內"，顯示一個失敗結果頁可能更清楚。
      
      // 讓我們保持 CheckinForm 的錯誤提示，但如果用戶點擊了簽到後失敗，
      // 我們可以用 Modal 或切換視圖。
      // 鑑於用戶要求，我們試試切換視圖。
      return (
        <CheckinResult
            status="error"
            title="簽到失敗"
            message={checkinMessage || "發生未知錯誤"}
            onRetry={() => {
                setCheckinStatus('idle');
                setCheckinMessage(null);
                // 重新獲取位置
                if (event.location_validation) {
                    getGeolocation().then(coords => {
                        if (coords) setGeoData(`${coords.latitude},${coords.longitude}`);
                    });
                }
            }}
        />
      );
  }

  // 解析使用者位置
  const userCoords = geoData ? {
    lat: parseFloat(geoData.split(',')[0]),
    lng: parseFloat(geoData.split(',')[1])
  } : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 當前登錄用戶信息 */}
      {user && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-blue-800">
              當前登錄：<strong>{user.name}</strong>
              {user.company && <span className="ml-2 text-blue-600">({user.company})</span>}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            切換帳號
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-center mb-6">{event.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：活動資訊 */}
        <div className="lg:col-span-1">
          <EventDetails
            startTime={event.start_time}
            endTime={event.end_time}
            location={event.location || '未指定'}
            requiresLocation={event.location_validation}
            isAvailable={eventIsActive}
          />

          {event.description && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">活動描述</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* 簽到記錄顯示 */}
          {currentCheckin && (
            <div className="mt-6">
              <CheckinRecord
                checkin={currentCheckin}
                event={event}
              />
            </div>
          )}
        </div>

        {/* 右側：地圖 */}
        {event.location_validation && event.latitude && event.longitude && (
          <div className="lg:col-span-2">
            <EventLocationMap
              eventLatitude={event.latitude}
              eventLongitude={event.longitude}
              radius={event.radius || 100}
              userLatitude={userCoords?.lat}
              userLongitude={userCoords?.lng}
            />
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 max-w-md mx-auto lg:max-w-none">
        {/* 簽到/簽退表單 - 統一處理 */}
        {!hasCheckedOut && (
          <CheckinForm
            userName={user.name}
            isAvailable={
              hasCheckedIn
                ? canCheckout  // 已簽到：根據簽退條件判斷
                : (eventIsActive && isCheckinAvailable)  // 未簽到：根據活動時間和資格判斷
            }
            onCheckin={handleCheckin}
            status={checkinStatus}
            error={error || checkinMessage}
            template={
              hasCheckedIn
                ? getCombinedTemplate('checkout') || undefined  // 已簽到：使用簽退表單
                : getCombinedTemplate('checkin') || undefined   // 未簽到：使用簽到表單
            }
            hasCheckedIn={hasCheckedIn}
            actionType={hasCheckedIn ? 'checkout' : 'checkin'}
          />
        )}

        {!eventIsActive && !hasCheckedIn && (
          <p className="text-red-500 text-center mt-4">活動不在可簽到時間範圍內</p>
        )}
      </div>
    </div>
  );
}