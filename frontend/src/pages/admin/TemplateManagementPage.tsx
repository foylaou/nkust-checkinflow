import { useState, useEffect } from 'react';
import { templateService } from '../../services/templateService';
import type {RegistrationTemplate, FormField, RegistrationTemplateCreate} from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

export default function TemplateManagementPage() {
  const { admin } = useAuthStore();
  const [templates, setTemplates] = useState<RegistrationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyTemplate: RegistrationTemplateCreate = {
    name: '',
    type: 'registration',
    survey_trigger: 'course_start',
    is_public: false,
    fields_schema: []
  };

  const [formData, setFormData] = useState<RegistrationTemplateCreate>(emptyTemplate);

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Fetch templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const addField = () => {
    const newField: FormField = {
      name: `field_${formData.fields_schema.length + 1}`,
      label: '',
      type: 'text',
      required: false
    };
    setFormData({ ...formData, fields_schema: [...formData.fields_schema, newField] });
  };

  const removeField = (index: number) => {
    const fields = [...formData.fields_schema];
    fields.splice(index, 1);
    setFormData({ ...formData, fields_schema: fields });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const fields = [...formData.fields_schema];
    fields[index] = { ...fields[index], ...updates };
    setFormData({ ...formData, fields_schema: fields });
  };

  const handleStartCreate = () => {
    setFormData(emptyTemplate);
    setEditingId(null);
    setIsEditing(true);
    setError(null);
  };

  const handleStartEdit = (template: RegistrationTemplate) => {
    setFormData({
      name: template.name,
      type: template.type,
      survey_trigger: template.survey_trigger || 'course_start',
      is_public: template.is_public,
      fields_schema: [...template.fields_schema]
    });
    setEditingId(template.id);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('請輸入範本名稱');
      return;
    }
    try {
      if (editingId) {
        await templateService.updateTemplate(editingId, formData);
      } else {
        await templateService.createTemplate(formData);
      }
      setIsEditing(false);
      setEditingId(null);
      setFormData(emptyTemplate);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.detail || '儲存失敗');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">表單範本管理</h1>
        <button
          onClick={isEditing ? () => setIsEditing(false) : handleStartCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium"
        >
          {isEditing ? '取消' : '創建新範本'}
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? '編輯範本' : '創建新範本'}</h2>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">範本名稱</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="例如：研討會註冊、課程問卷"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">範本類型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border rounded p-2"
                >
                  <option value="registration">活動註冊 (每次報名填寫)</option>
                  <option value="survey">問卷調查 (特定時機填寫)</option>
                  <option value="profile_extension">基本資料擴充 (使用者綁定，填過即紀錄)</option>
                </select>
              </div>
            </div>

            {formData.type === 'survey' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">調查觸發時機</label>
                <select
                  value={formData.survey_trigger}
                  onChange={(e) => setFormData({ ...formData, survey_trigger: e.target.value as any })}
                  className="w-full border rounded p-2"
                >
                  <option value="course_start">課程開始 (簽到時)</option>
                  <option value="course_end">課程結束 (簽退時)</option>
                </select>
              </div>
            )}

            {admin?.name === '系統管理員' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">設為公共範本 (所有管理員可用)</label>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">欄位設定</h3>
                <button onClick={addField} className="text-sm bg-gray-100 px-2 py-1 rounded border">添加欄位</button>
              </div>

              {formData.fields_schema.length === 0 && (
                <p className="text-gray-500 text-sm">尚未添加任何自定義欄位。</p>
              )}

              <div className="space-y-3">
                {formData.fields_schema.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start border p-3 rounded bg-gray-50">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="欄位標籤 (例如：學號)"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="border p-1 text-sm rounded"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as any })}
                          className="border p-1 text-sm rounded"
                        >
                          <option value="text">文字</option>
                          <option value="textarea">長文字 (多行)</option>
                          <option value="number">數字</option>
                          <option value="select">下拉選單</option>
                          <option value="radio">單選鈕</option>
                          <option value="checkbox">複選框</option>
                          <option value="date">日期</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="mr-1"
                          /> 必填
                        </label>
                        {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                          <input
                            type="text"
                            placeholder="選項 (逗號分隔)"
                            value={field.options?.join(',')}
                            onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                            className="border p-1 text-xs rounded flex-1"
                          />
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeField(index)} className="text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white py-2 rounded font-bold"
            >
              {editingId ? '更新範本' : '儲存範本'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{template.name}</h3>
              <div className="flex gap-1">
                {template.is_public && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">公共</span>
                )}
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  {template.type === 'registration' ? '註冊' : template.type === 'survey' ? '調查' : '基本資料'}
                </span>
              </div>
            </div>
            {template.type === 'survey' && (
              <p className="text-xs text-indigo-600 mb-1">
                觸發：{template.survey_trigger === 'course_start' ? '課程開始' : '課程結束'}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-4">欄位數量: {template.fields_schema.length}</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleStartEdit(template)}
                className="text-indigo-600 text-sm hover:underline"
              >
                編輯
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('確定要刪除此範本嗎？')) {
                    await templateService.deleteTemplate(template.id);
                    fetchTemplates();
                  }
                }}
                className="text-red-600 text-sm hover:underline"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
