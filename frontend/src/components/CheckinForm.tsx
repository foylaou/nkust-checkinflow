// src/components/CheckinForm.tsx
import { useState } from 'react';
import type {RegistrationTemplate} from '../types';

interface CheckinFormProps {
  userName: string;
  isAvailable: boolean;
  onCheckin: (dynamicData?: Record<string, any>) => Promise<void>;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  template?: RegistrationTemplate;
  actionType?: 'checkin' | 'checkout';
  hasCheckedIn?: boolean; // 新增：是否已簽到
}

export default function CheckinForm({
  userName,
  isAvailable,
  onCheckin,
  status,
  error,
  template,
  actionType = 'checkin',
  hasCheckedIn = false
}: CheckinFormProps) {
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});

  const handleInputChange = (name: string, value: any) => {
    setDynamicData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckin(template ? dynamicData : undefined);
  };

  const getButtonText = () => {
    if (status === 'loading') return '處理中...';
    // 如果已簽到，按鈕顯示簽退；否則顯示簽到
    return (hasCheckedIn || actionType === 'checkout') ? '立即簽退' : '立即簽到';
  };

  // 判斷按鈕顏色
  const isCheckoutButton = hasCheckedIn || actionType === 'checkout';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-medium">簽到人員</p>
        <p>{userName}</p>
      </div>

      {(template && template.fields_schema && template.fields_schema.length > 0) && (
        <div className="space-y-4 border-t pt-4">
          <p className="font-bold text-gray-700">請填寫以下資訊</p>
          {template.fields_schema.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={dynamicData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">請選擇</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={dynamicData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={3}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {field.options?.map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.name}
                        value={opt}
                        required={field.required}
                        checked={dynamicData[field.name] === opt}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <div className="space-y-2">
                  {field.options?.map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={opt}
                        checked={(dynamicData[field.name] || []).includes(opt)}
                        onChange={(e) => {
                          const currentValues = dynamicData[field.name] || [];
                          const nextValues = e.target.checked
                            ? [...currentValues, opt]
                            : currentValues.filter((v: string) => v !== opt);
                          handleInputChange(field.name, nextValues);
                        }}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  required={field.required}
                  value={dynamicData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full border p-2 rounded"
                />
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  required={field.required}
                  value={dynamicData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type="text"
                  required={field.required}
                  value={dynamicData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !isAvailable}
        className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
          status === 'loading' || !isAvailable
            ? 'bg-gray-400 cursor-not-allowed'
            : isCheckoutButton
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {getButtonText()}
      </button>

      {status === 'error' && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">
          {error || '簽到失敗，請重試'}
        </div>
      )}
    </form>
  );
}
