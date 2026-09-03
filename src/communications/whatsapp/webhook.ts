import type { Env } from '../../types';
import { verifyWhatsAppSignature } from './client';
import { sha256 } from '../../core/auth/crypto';

export async function handleWhatsAppWebhook(request: Request, env: Env) {
  const rawBody = await request.text();
  if (!await verifyWhatsAppSignature(rawBody,request.headers.get('x-support-signature'),env.WHATSAPP_SUPPORT_WEBHOOK_SECRET)) return Response.json({success:false,error:{code:'INVALID_SIGNATURE'}},{status:401});
  const deliveryId=request.headers.get('x-support-delivery-id')||request.headers.get('x-support-idempotency-key')||await sha256(rawBody);
  const event=JSON.parse(rawBody) as {event?:string};
  const insert=await env.DB.prepare(`INSERT OR IGNORE INTO webhook_receipts (id,source,event_type,payload_hash) VALUES (?,?,?,?)`).bind(deliveryId,'ulib_whatsapp_hub',event.event||null,await sha256(rawBody)).run();
  if(!insert.meta.changes)return Response.json({success:true,data:{received:true,duplicate:true}});
  // Workflow-specific WhatsApp commands will be added as independent modules.
  await env.DB.prepare('UPDATE webhook_receipts SET processed_at=datetime(\'now\') WHERE id=?').bind(deliveryId).run();
  return Response.json({success:true,data:{received:true,deliveryId}});
}
