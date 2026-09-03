import type { RequestContext } from '../../types';

export type Handler = (context: RequestContext) => Promise<Response> | Response;
interface Route { method: string; pattern: URLPattern; handler: Handler; auth: boolean; }

export class Router {
  private routes: Route[] = [];

  on(method: string, pathname: string, handler: Handler, auth = true) {
    this.routes.push({ method, pattern: new URLPattern({ pathname }), handler, auth });
    return this;
  }

  match(request: Request): { route: Route; params: Record<string, string> } | null {
    const url = new URL(request.url);
    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      const match = route.pattern.exec(url);
      if (!match) continue;
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(match.pathname.groups)) if (value) params[key] = value;
      return { route, params };
    }
    return null;
  }
}
