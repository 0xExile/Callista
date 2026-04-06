import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-6 max-w-lg">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-beige-900">Something went wrong</h3>
              <p className="text-beige-600">
                We encountered an unexpected error while loading this module.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 p-4 bg-red-50 text-red-700 text-xs text-left overflow-auto rounded-xl border border-red-100">
                  {this.state.error?.message}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 mx-auto transition-all shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
