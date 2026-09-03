import type { Env } from './types';
import { Router } from './core/http/router';
import { authenticate } from './core/auth/middleware';
import { cors, fail, ok } from './core/http/response';
import { notFound } from './core/errors/app-error';
import { registerAuthRoutes } from './core/auth/routes';
import { registerOrganizationRoutes } from './modules/organizations/routes';
import { registerContactRoutes } from './modules/contacts/routes';
import { registerProjectRoutes } from './modules/projects/routes';
import { registerTaskRoutes } from './modules/tasks/routes';
import { registerCommentRoutes } from './modules/comments/routes';
import { registerNotificationRoutes } from './modules/notifications/routes';
import { consumeNotifications } from './queues/notification-consumer';
import { runReminders } from './scheduled/reminders';
import { handleWhatsAppWebhook } from './communications/whatsapp/webhook';

const router = new Router();
router.on('GET','/health',({env})=>ok({service:env.APP_NAME,status:'healthy',environment:env.APP_ENV,time:new Date().toISOString()}),false);
router.on('POST','/v1/webhooks/whatsapp',({request,env})=>handleWhatsAppWebhook(request,env),false);
registerAuthRoutes(router);
registerOrganizationRoutes(router);
registerContactRoutes(router);
registerProjectRoutes(router);
registerTaskRoutes(router);
registerCommentRoutes(router);
registerNotificationRoutes(router);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin=request.headers.get('origin');
    if(request.method==='OPTIONS')return cors(new Response(null,{status:204}),origin);
    try {
      const matched=router.match(request);
      if(!matched)throw notFound('Endpoint not found');
      const user=matched.route.auth?await authenticate(request,env):undefined;
      return cors(await matched.route.handler({request,env,url:new URL(request.url),params:matched.params,user}),origin);
    } catch(error) { return cors(fail(error),origin); }
  },
  async queue(batch: MessageBatch<import('./types').NotificationJob>, env: Env) { await consumeNotifications(batch,env); },
  async scheduled(_controller: ScheduledController, env: Env, context: ExecutionContext) { context.waitUntil(runReminders(env)); },
};
