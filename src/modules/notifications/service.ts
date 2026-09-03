import type { Env, NotificationChannel } from '../../types';
import { id } from '../../core/database/id';

interface NotifyInput { organizationId: string; userId: string; eventType: string; title: string; body: string; entityType?: string; entityId?: string; }

export async function notify(env: Env, input: NotifyInput) {
  const notificationId = id('ntf');
  await env.DB.prepare(`INSERT INTO notifications (id,organization_id,user_id,event_type,title,body,entity_type,entity_id) VALUES (?,?,?,?,?,?,?,?)`).bind(notificationId,input.organizationId,input.userId,input.eventType,input.title,input.body,input.entityType || null,input.entityId || null).run();
  const user = await env.DB.prepare('SELECT email,phone,full_name FROM users WHERE id=?').bind(input.userId).first<{ email: string; phone: string | null; full_name: string }>();
  const preference = await env.DB.prepare('SELECT * FROM notification_preferences WHERE organization_id=? AND user_id=? AND event_type=?').bind(input.organizationId,input.userId,input.eventType).first<Record<string, number>>();
  const channels: Array<{ channel: Exclude<NotificationChannel,'in_app'>; recipient: string | null; enabled: boolean }> = [
    { channel: 'email', recipient: user?.email || null, enabled: preference ? Boolean(preference.email) : true },
    { channel: 'sms', recipient: user?.phone || null, enabled: Boolean(preference?.sms) },
    { channel: 'whatsapp', recipient: user?.phone || null, enabled: Boolean(preference?.whatsapp) },
  ];
  for (const item of channels) {
    if (!item.enabled || !item.recipient) continue;
    const deliveryId = id('ndl');
    await env.DB.prepare(`INSERT OR IGNORE INTO notification_deliveries (id,organization_id,notification_id,channel,recipient,provider) VALUES (?,?,?,?,?,?)`).bind(deliveryId,input.organizationId,notificationId,item.channel,item.recipient,item.channel === 'sms' ? 'egosms' : item.channel === 'email' ? 'resend' : 'ulib_whatsapp_hub').run();
    await env.NOTIFICATION_QUEUE.send({ deliveryId, organizationId: input.organizationId, notificationId, channel: item.channel, recipient: item.recipient, subject: input.title, body: input.body });
  }
  return notificationId;
}
