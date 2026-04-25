
export interface CompanySettings {
  id: string;
  company_name?: string;
  order_email?: string;
  whatsapp_country_code: string;
  whatsapp_number?: string;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  // SMTP
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  smtp_from_name?: string;
  smtp_from_email?: string;
  // Twilio
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_whatsapp_from?: string;
  twilio_content_sid?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySettingsFormData {
  company_name: string;
  order_email: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  // SMTP
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  smtp_from_name: string;
  smtp_from_email: string;
  // Twilio
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_from: string;
  twilio_content_sid: string;
}
