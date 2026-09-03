import type { Env, NotificationJob } from '../types';
import { sendEmail } from '../communications/resend/client';
import { sendSms } from '../communications/egosms/client';
import { sendWhatsApp } from '../communications/whatsapp/client';

export async function consumeNotifications(batch: MessageBatch<NotificationJob>, env: Env) {
  for (const message of batch.messages) {
    const job = message.body;
    try {
      await env.DB.prepare(`UPDATE notification_deliveries SET status='sending',attempts=attempts+1 WHERE id=? AND status NOT IN ('sent','delivered')`).bind(job.deliveryId).run();
      let providerId = '';
      if (job.channel === 'email') providerId = await sendEmail(env, job.recipient, job.subject || env.APP_NAME, job.body);
      if (job.channel === 'sms') providerId = await sendSms(env, job.recipient, job.body);
      if (job.channel === 'whatsapp') {
        const result = await sendWhatsApp(env, job.recipient, job.body, job.deliveryId, job.templateName ? { name: job.templateName, language: job.templateLanguage, variables: job.variables } : undefined);
        providerId = String(result.messageId || result.id || '');
      }
      await env.DB.prepare(`UPDATE notification_deliveries SET status='sent',provider_message_id=?,sent_at=?,last_error=NULL WHERE id=?`).bind(providerId,new Date().toISOString(),job.deliveryId).run();
      message.ack();
    } catch (error) {
      await env.DB.prepare(`UPDATE notification_deliveries SET status='failed',last_error=? WHERE id=?`).bind(error instanceof Error ? error.message.slice(0,1000) : 'Unknown delivery error',job.deliveryId).run();
      message.retry({ delaySeconds: Math.min(3600, 30 * 2 ** message.attempts) });
    }
  }
}
