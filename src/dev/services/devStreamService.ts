// PAHAM Dev Cockpit Live Telemetry & Real-Time Stream Service
// Uses polling with adaptive backoff to stream live metrics, events, and health

import { devApiClient, LiveTelemetryResponse } from './devApiClient';

type TelemetryListener = (data: LiveTelemetryResponse) => void;

class DevStreamService {
  private listeners: TelemetryListener[] = [];
  private pollIntervalId: any = null;
  private isPolling = false;
  private cachedTelemetry: LiveTelemetryResponse | null = null;

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.push(listener);
    if (this.cachedTelemetry) {
      listener(this.cachedTelemetry);
    }
    if (!this.isPolling) {
      this.startPolling();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopPolling();
      }
    };
  }

  private async fetchAndUpdate() {
    try {
      const data = await devApiClient.fetchTelemetry();
      this.cachedTelemetry = data;
      this.listeners.forEach(listener => {
        try {
          listener(data);
        } catch {}
      });
    } catch {}
  }

  private startPolling() {
    this.isPolling = true;
    this.fetchAndUpdate();
    this.pollIntervalId = setInterval(() => {
      this.fetchAndUpdate();
    }, 4000);
  }

  private stopPolling() {
    this.isPolling = false;
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public getCachedTelemetry(): LiveTelemetryResponse | null {
    return this.cachedTelemetry;
  }
}

export const devStreamService = new DevStreamService();
