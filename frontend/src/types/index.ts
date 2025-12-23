/**
 * TypeScript 類型定義
 */

// ==================== Admin ====================
export interface Admin {
  id: number;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: Admin;
}

// ==================== User ====================
export interface User {
  id: number;
  line_user_id: string;
  name: string;
  phone: string;
  company: string;
  department: string;
  profile_data?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  line_user_id: string;
  name: string;
  phone: string;
  company: string;
  department: string;
  profile_data?: Record<string, any>;
}

// ==================== Event ====================
export interface Event {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  max_participants?: number;
  event_type: string;
  location_validation: boolean;
  require_checkout: boolean;
  checkout_mode?: 'after_duration' | 'at_end_time';
  checkout_duration?: number; // 簽到後N分鐘才能簽退
  visibility: 'public' | 'private';
  series_id?: string;
  template_id?: string;
  survey_start_template_id?: string;
  survey_end_template_id?: string;
  profile_extension_template_id?: string;
  template_ids?: string[];
  templates?: RegistrationTemplate[];
  qrcode_url?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface EventWithStats extends Event {
  checkins: number;
}

export interface EventCreate {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  max_participants?: number;
  event_type?: string;
  location_validation?: boolean;
  require_checkout?: boolean;
  checkout_mode?: 'after_duration' | 'at_end_time';
  checkout_duration?: number;
  visibility?: 'public' | 'private';
  series_id?: string;
  template_id?: string;
  survey_start_template_id?: string;
  survey_end_template_id?: string;
  profile_extension_template_id?: string;
  template_ids?: string[];
}



export interface EventSeriesCreate {
  event_base: Omit<EventCreate, 'created_by'>;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time_local: string;
  end_time_local: string;
}

export interface EventUpdate {
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  max_participants?: number;
  event_type?: string;
  location_validation?: boolean;
  require_checkout?: boolean;
  checkout_mode?: 'after_duration' | 'at_end_time';
  checkout_duration?: number;
  visibility?: 'public' | 'private';
  series_id?: string;
  template_id?: string;
  survey_start_template_id?: string;
  survey_end_template_id?: string;
  profile_extension_template_id?: string;
}



export interface EventStats {
  total: number;
  checked_in?: number;
  checked_out?: number;
}

// ==================== RegistrationTemplate ====================
export interface FormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'textarea';
  required: boolean;
  label: string;
  options?: string[]; // For select, radio, checkbox
  placeholder?: string;
}

export interface RegistrationTemplate {
  id: string;
  name: string;
  type: 'registration' | 'survey' | 'profile_extension';
  survey_trigger?: 'course_start' | 'course_end';
  fields_schema: FormField[];
  is_public: boolean;
  created_by_admin_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface RegistrationTemplateCreate {
  name: string;
  type: 'registration' | 'survey' | 'profile_extension';
  survey_trigger?: 'course_start' | 'course_end';
  fields_schema: FormField[];
  is_public: boolean;
}

// ==================== Checkin ====================
export interface Checkin {
  id: number;
  user_id: number;
  event_id: string;
  checkin_time: string;
  checkout_time?: string;
  geolocation?: string;
  dynamic_data?: Record<string, any>;
  status: string;
  is_valid: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CheckinCreate {
  user_id: number;
  event_id: string;
  geolocation?: string;
  dynamic_data?: Record<string, any>;
  profile_data?: Record<string, any>;
}

export interface UserInfo {
  name: string;
  phone: string;
  company: string;
  department: string;
}

export interface CheckinWithUser extends Checkin {
  user: UserInfo;
}

export interface CheckinValidateResponse {
  valid: boolean;
  message: string;
  user?: UserInfo;
  checkin?: Checkin;
}

// ==================== API Response ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  detail?: string;
}
