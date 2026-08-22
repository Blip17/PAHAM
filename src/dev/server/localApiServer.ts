// Local Vite API Dev Server Middleware
// Bridges Vite development server to Node serverless API handlers during 'npm run dev'

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import unifiedEventsHandler from '../../../api/events';
import unifiedDevHandler from '../../../api/dev';
import publishHandler from '../../../api/events/publish';
import streamHandler from '../../../api/events/stream';
import inboxHandler from '../../../api/events/inbox';
import listHandler from '../../../api/events/list';
import authHandler from '../../../api/dev/auth';
import telemetryHandler from '../../../api/dev/telemetry';
import databaseHandler from '../../../api/dev/database';
import devEventsHandler from '../../../api/dev/events';
import flagsHandler from '../../../api/dev/flags';
import aiLogsHandler from '../../../api/dev/ai-logs';
import recommendationsHandler from '../../../api/dev/recommendations';
import securityHandler from '../../../api/dev/security';
import replayHandler from '../../../api/dev/replay';

const routes: Record<string, (req: any, res: any) => any> = {
  '/api/events': unifiedEventsHandler,
  '/api/dev': unifiedDevHandler,
  '/api/events/publish': publishHandler,
  '/api/events/stream': streamHandler,
  '/api/events/inbox': inboxHandler,
  '/api/events/list': listHandler,
  '/api/dev/auth': authHandler,
  '/api/dev/telemetry': telemetryHandler,
  '/api/dev/database': databaseHandler,
  '/api/dev/events': devEventsHandler,
  '/api/dev/flags': flagsHandler,
  '/api/dev/ai-logs': aiLogsHandler,
  '/api/dev/recommendations': recommendationsHandler,
  '/api/dev/security': securityHandler,
  '/api/dev/replay': replayHandler,
};

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

        const handler = routes[pathname];
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
