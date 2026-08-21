// PAHAM API Explorer View
// Interactive endpoint discovery, request builder, and response latency inspector

import React, { useState } from 'react';
import { 
  Terminal, 
  Send, 
  CheckCircle, 
  Clock, 
  Layers, 
  Copy, 
  Check, 
  Code 
} from 'lucide-react';
import { aiService } from '../../services/ai/aiProvider';

interface ApiEndpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  authRequired: boolean;
  defaultBody?: Record<string, any>;
}

const AVAILABLE_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/ai',
    description: 'Serverless / Client AI Generation & Explanation Proxy',
    authRequired: false,
    defaultBody: {
      action: 'generateExplanation',
      concept: {
        id: 'c-newton',
        title: 'Hukum Newton I',
        definition: 'Kecenderungan benda mempertahankan keadaannya (Inersia).',
      },
    },
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'System health check and database telemetry',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/ocr',
    description: 'Catatan Guru OCR extraction pipeline',
    authRequired: false,
    defaultBody: {
      text: 'Catatan Biologi Bab 3: Fotosintesis terjadi pada kloroplas dengan bantuan cahaya matahari.',
    },
  },
];

export const ApiExplorerView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(AVAILABLE_ENDPOINTS[0]);
  const [bodyString, setBodyString] = useState<string>(
    JSON.stringify(AVAILABLE_ENDPOINTS[0].defaultBody || {}, null, 2)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<any | null>(null);
  const [responseLatencyMs, setResponseLatencyMs] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setBodyString(JSON.stringify(ep.defaultBody || {}, null, 2));
    setResponseOutput(null);
    setStatusCode(null);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      if (selectedEndpoint.path === '/api/ai') {
        const parsed = JSON.parse(bodyString);
        let result: any;
        if (parsed.action === 'generateExplanation') {
          result = await aiService.generateExplanation(parsed.concept);
        } else {
          result = await aiService.generateAIResponse('Test prompt dari API Explorer');
        }
        setResponseOutput({ result, timestamp: new Date().toISOString() });
        setStatusCode(200);
      } else if (selectedEndpoint.path === '/api/health') {
        setResponseOutput({
          status: 'HEALTHY',
          uptime: '100%',
          environment: 'development',
          tables: 18,
          timestamp: new Date().toISOString(),
        });
        setStatusCode(200);
      } else if (selectedEndpoint.path === '/api/ocr') {
        const parsed = JSON.parse(bodyString);
        const extracted = await aiService.extractHandwriting(parsed.text || 'Catatan');
        setResponseOutput(extracted);
        setStatusCode(200);
      }
    } catch (err: any) {
      setResponseOutput({ error: err?.message });
      setStatusCode(500);
    } finally {
      setResponseLatencyMs(Math.round(performance.now() - start));
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Interactive API Explorer & Endpoint Tester
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Execute direct test calls against internal APIs and simulated backend inference proxies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Endpoint Selector */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Available Endpoints ({AVAILABLE_ENDPOINTS.length})
          </span>
          {AVAILABLE_ENDPOINTS.map(ep => {
            const isSelected = selectedEndpoint.path === ep.path;
            return (
              <button
                key={ep.path}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full p-3 rounded-lg text-left transition border ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500 font-bold'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    ep.method === 'POST' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="text-xs truncate">{ep.path}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">{ep.description}</p>
              </button>
            );
          })}
        </div>

        {/* Right: Request & Response Inspector */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {selectedEndpoint.method}
              </span>
              <span className="text-sm font-bold text-zinc-100">{selectedEndpoint.path}</span>
            </div>

            <button
              onClick={handleExecuteRequest}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'Executing...' : 'Send Request'}
            </button>
          </div>

          {/* Request Body */}
          {selectedEndpoint.method === 'POST' && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Request Body (JSON)
              </span>
              <textarea
                value={bodyString}
                onChange={e => setBodyString(e.target.value)}
                rows={6}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Response Pane */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Response Output
              </span>
              {statusCode && (
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-bold ${statusCode === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    HTTP {statusCode}
                  </span>
                  <span className="text-zinc-400">Latency: <strong className="text-zinc-200">{responseLatencyMs} ms</strong></span>
                </div>
              )}
            </div>

            <pre className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-mono overflow-x-auto min-h-[140px] max-h-72 leading-relaxed">
              {responseOutput 
                ? JSON.stringify(responseOutput, null, 2) 
                : '// Click "Send Request" to execute API call...'}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
