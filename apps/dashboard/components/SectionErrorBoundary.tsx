'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the fallback card header */
  section?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SectionErrorBoundary]', this.props.section ?? 'unknown', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {this.props.section ? `Error en ${this.props.section}` : 'Algo salió mal'}
            </p>
            <p className="text-xs text-red-500 mt-1">
              {this.state.message || 'Ocurrió un error inesperado en esta sección.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
