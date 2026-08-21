// Reusable Error Boundary for PAHAM
// Isolates rendering errors and allows the student to reload without losing session context

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 rounded-lg bg-paper-100 border border-terracotta-300 text-center space-y-4 max-w-md mx-auto shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-terracotta-100 text-terracotta-800 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-lg font-medium text-ink-950">
              {this.props.fallbackTitle || 'Terjadi Kendala Memuat Tampilan'}
            </h3>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              {this.props.fallbackMessage || 'Komponen ini mengalami kendala sementara. Data belajarmu tetap tersimpan aman di database lokal.'}
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Muat Ulang Komponen
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
