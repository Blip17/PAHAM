// Local Vite API Dev Server Middleware
// Bridges Vite development server to Node serverless API handlers during 'npm run dev'

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import unifiedEventsHandler from '../../../api/events';
import unifiedDevHandler from '../../../api/dev';
import aiHandler from '../../../api/ai';

export function localApiDevPlugin(): Plugin {
  return {
    name: 'paham-local-api-dev-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname || '';

        let handler: any = null;
        if (pathname.startsWith('/api/events')) {
          handler = unifiedEventsHandler;
        } else if (pathname.startsWith('/api/dev')) {
          handler = unifiedDevHandler;
        } else if (pathname.startsWith('/api/ai')) {
          handler = aiHandler;
        }

        if (!handler) {
          return next();
        }

        // Augment response with VercelResponse helper methods (.status, .json)
        const vRes = res as any;
        vRes.status = function (statusCode: number) {
          res.statusCode = statusCode;
          return vRes;
        };
        vRes.json = function (jsonBody: any) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify(jsonBody));
          return vRes;
        };

        // Parse query params onto request
        const vReq = req as any;
        vReq.query = parsedUrl.query || {};

        // If path has subaction (e.g. /api/events/publish -> action: 'publish')
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length >= 3 && !vReq.query.action) {
          vReq.query.action = segments[2];
        }

        // Parse request body for POST/PUT
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          let rawBody = '';
          req.on('data', chunk => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              vReq.body = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              vReq.body = rawBody;
            }

            if (segments.length >= 3 && !vReq.body?.action) {
              if (typeof vReq.body === 'object') {
                vReq.body.action = segments[2];
              }
            }

            try {
              await handler(vReq, vRes);
            } catch (err: any) {
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
              }
            }
          });
        } else {
          try {
            await handler(vReq, vRes);
          } catch (err: any) {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
            }
          }
        }
      });
    },
  };
}
