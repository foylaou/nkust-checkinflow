import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { templateService } from '../../services/templateService';
import type {EventCreate, EventSeriesCreate, RegistrationTemplate} from '../../types';

import MapLocationPicker from '../../components/MapLocationPicker';

export default function CreateEventPage() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<RegistrationTemplate[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    radius: 100,
    max_participants: '',
    event_type: '會議',
    location_validation: false,
    require_checkout: false,
    checkout_mode: 'after_duration' as 'after_duration' | 'at_end_time',
    checkout_duration: 30,
    visibility: 'public' as 'public' | 'private',
    template_id: '',
    survey_start_template_id: '',
    survey_end_template_id: '',
    profile_extension_template_id: '',
    template_ids: [] as string[]
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [seriesConfig, setSeriesConfig] = useState({
    start_date: '',
    end_date: '',
    days_of_week: [] as number[],
    start_time_local: '09:00',
    end_time_local: '10:00'
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await templateService.getTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Fetch templates error:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isRecurring) {
        // 處理系列活動
        if (!seriesConfig.start_date || !seriesConfig.end_date || seriesConfig.days_of_week.length === 0) {
          throw new Error('請填寫完整的系列活動設定');
        }

        const dummyStartTime = new Date();
        const dummyEndTime = new Date(dummyStartTime.getTime() + 3600000); // +1 hour

        const seriesData: EventSeriesCreate = {
          event_base: {
            name: formData.name,
            description: formData.description,
            start_time: dummyStartTime.toISOString(), 
            end_time: dummyEndTime.toISOString(),
            location: formData.location,
            latitude: formData.latitude,
            longitude: formData.longitude,
            radius: formData.radius,
            max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
            event_type: formData.event_type,
            location_validation: formData.location_validation,
            require_checkout: formData.require_checkout,
            checkout_mode: formData.require_checkout ? formData.checkout_mode : undefined,
            checkout_duration: formData.require_checkout && formData.checkout_mode === 'after_duration'
              ? formData.checkout_duration
              : undefined,
            visibility: formData.visibility,
            template_id: formData.template_id || undefined,
            survey_start_template_id: formData.survey_start_template_id || undefined,
            survey_end_template_id: formData.survey_end_template_id || undefined,
            profile_extension_template_id: formData.profile_extension_template_id || undefined,

          },
          start_date: new Date(seriesConfig.start_date).toISOString(),
          end_date: new Date(seriesConfig.end_date).toISOString(),
          days_of_week: seriesConfig.days_of_week,
          start_time_local: seriesConfig.start_time_local,
          end_time_local: seriesConfig.end_time_local
        };

        await eventService.createEventSeries(seriesData);
        navigate('/dashboard');
      } else {
        // 處理單個活動
        const startTime = new Date(formData.start_time);
        const endTime = new Date(formData.end_time);

        if (endTime <= startTime) {
          throw new Error('結束時間必須晚於開始時間');
        }

        const createData: EventCreate = {
          name: formData.name,
          description: formData.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: formData.radius,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
          event_type: formData.event_type,
          location_validation: formData.location_validation,
          require_checkout: formData.require_checkout,
          checkout_mode: formData.require_checkout ? formData.checkout_mode : undefined,
          checkout_duration: formData.require_checkout && formData.checkout_mode === 'after_duration'
            ? formData.checkout_duration
            : undefined,
          visibility: formData.visibility,
          template_id: formData.template_id || undefined,
          survey_start_template_id: formData.survey_start_template_id || undefined,
          survey_end_template_id: formData.survey_end_template_id || undefined,
          profile_extension_template_id: formData.profile_extension_template_id || undefined,

        };

        const event = await eventService.createEvent(createData);
        navigate(`/dashboard/event/${event.id}`);
      }
    } catch (err: any) {
      console.error('創建活動失敗:', err);
      setError(err.message || err.response?.data?.detail || '創建活動失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">創建新活動</h1>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          返回儀表板
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活動名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活動描述
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公開權限
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="public">公開 (所有人可見)</option>
              <option value="private">私人 (僅限擁有連結者)</option>
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-md font-bold text-gray-800 mb-4">表單範本選擇 (多選)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 註冊與擴充 */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 mb-2">活動註冊 & 基本資料擴充</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-white rounded border">
                    {templates.filter(t => t.type === 'registration' || t.type === 'profile_extension').map(t => (
                      <label key={t.id} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.template_ids.includes(t.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...formData.template_ids, t.id]
                              : formData.template_ids.filter(id => id !== t.id);
                            setFormData({ ...formData, template_ids: ids });
                          }}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] mr-1 ${t.type === 'registration' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {t.type === 'registration' ? '註冊' : '擴充'}
                          </span>
                          {t.name}
                        </span>
                      </label>
                    ))}
                    {templates.filter(t => t.type === 'registration' || t.type === 'profile_extension').length === 0 && (
                      <p className="text-xs text-gray-400">尚無註冊或擴充範本</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 問卷調查 */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2">問卷調查 (開始/結束)</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-white rounded border">
                    {templates.filter(t => t.type === 'survey').map(t => (
                      <label key={t.id} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.template_ids.includes(t.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...formData.template_ids, t.id]
                              : formData.template_ids.filter(id => id !== t.id);
                            setFormData({ ...formData, template_ids: ids });
                          }}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] mr-1 bg-green-100 text-green-700">
                            {t.survey_trigger === 'course_start' ? '開課' : '結課'}
                          </span>
                          {t.name}
                        </span>
                      </label>
                    ))}
                    {templates.filter(t => t.type === 'survey').length === 0 && (
                      <p className="text-xs text-gray-400">尚無問卷範本</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-md">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="is_recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_recurring" className="ml-2 block text-sm font-bold text-indigo-900">
                這是週期性活動 (系列活動)
              </label>
            </div>

            {isRecurring ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      系列開始日期
                    </label>
                    <input
                      type="date"
                      value={seriesConfig.start_date}
                      onChange={(e) => setSeriesConfig({...seriesConfig, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      系列結束日期
                    </label>
                    <input
                      type="date"
                      value={seriesConfig.end_date}
                      onChange={(e) => setSeriesConfig({...seriesConfig, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重複週期 (每週)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const val = index; // 0 是週一
                          setSeriesConfig(prev => ({
                            ...prev,
                            days_of_week: prev.days_of_week.includes(val)
                              ? prev.days_of_week.filter(d => d !== val)
                              : [...prev.days_of_week, val]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          seriesConfig.days_of_week.includes(index)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        週{day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      上課/開始時間
                    </label>
                    <input
                      type="time"
                      value={seriesConfig.start_time_local}
                      onChange={(e) => setSeriesConfig({...seriesConfig, start_time_local: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      下課/結束時間
                    </label>
                    <input
                      type="time"
                      value={seriesConfig.end_time_local}
                      onChange={(e) => setSeriesConfig({...seriesConfig, end_time_local: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    required={!isRecurring}
                    value={formData.start_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    required={!isRecurring}
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活動地點 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活動類型
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="會議">會議</option>
                <option value="研討會">研討會</option>
                <option value="工作坊">工作坊</option>
                <option value="課程">課程</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                人數限制 (選填)
              </label>
              <input
                type="number"
                name="max_participants"
                min="1"
                value={formData.max_participants}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="location_validation"
                name="location_validation"
                checked={formData.location_validation}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="location_validation" className="ml-2 block text-sm text-gray-700">
                啟用位置驗證
              </label>
            </div>

            {formData.location_validation && (
              <div className="ml-6 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-3">
                  提示：您可以在上方「活動地點」欄位輸入地址，然後在地圖搜尋框中搜尋該地點
                </p>
                <MapLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  radius={formData.radius}
                  locationName={formData.location}
                  onLocationChange={(lat, lng) => {
                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                  onRadiusChange={(radius) => {
                    setFormData(prev => ({ ...prev, radius }));
                  }}
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="require_checkout"
                name="require_checkout"
                checked={formData.require_checkout}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="require_checkout" className="ml-2 block text-sm text-gray-700">
                需要簽退
              </label>
            </div>

            {formData.require_checkout && (
              <div className="ml-6 p-4 bg-gray-50 rounded-md space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    簽退時間限制
                  </label>
                  <select
                    name="checkout_mode"
                    value={formData.checkout_mode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="after_duration">簽到後 N 分鐘才能簽退</option>
                    <option value="at_end_time">活動結束時間到才能簽退</option>
                  </select>
                </div>

                {formData.checkout_mode === 'after_duration' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      簽到後 {formData.checkout_duration} 分鐘可簽退
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={formData.checkout_duration}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          checkout_duration: parseInt(e.target.value)
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5分鐘</span>
                      <span>90分鐘</span>
                      <span>180分鐘</span>
                    </div>
                  </div>
                )}

                {formData.checkout_mode === 'at_end_time' && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    用戶必須等到活動結束時間（{formData.end_time ? new Date(formData.end_time).toLocaleString('zh-TW') : '未設定'}）才能簽退
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? '創建中...' : '創建活動'}
            </button>
            <Link
              to="/dashboard"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
            >
              取消
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}