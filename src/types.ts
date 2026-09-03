export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  NOTIFICATION_QUEUE: Queue<NotificationJob>;
  APP_NAME: string;
  APP_ENV: string;
  JWT_SECRET: string;
  WHATSAPP_SUPPORT_HUB_URL: string;
  WHATSAPP_SUPPORT_APP_KEY: string;
  WHATSAPP_SUPPORT_WEBHOOK_SECRET: string;
  EGOSMS_USERNAME: string;
  EGOSMS_PASSWORD: string;
  EGOSMS_SENDER_ID: string;
  EGOSMS_API_URL?: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
}

export interface AuthUser {
  id: string;
  organizationId: string;
  role: string;
  email: string;
}

export interface RequestContext {
  request: Request;
  env: Env;
  url: URL;
  params: Record<string, string>;
  user?: AuthUser;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export interface NotificationJob {
  deliveryId: string;
  organizationId: string;
  notificationId: string;
  channel: Exclude<NotificationChannel, 'in_app'>;
  recipient: string;
  subject?: string;
  body: string;
  templateName?: string;
  templateLanguage?: string;
  variables?: Record<string, string>;
}
