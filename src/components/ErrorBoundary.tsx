/**
 * FIX #10: Error Boundary Component
 * 
 * Catches React errors and shows recovery UI instead of crashing the app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use centralized error logging
    import('@/utils/errorHandling').then(({ logError }) => {
      logError(error, 'ErrorBoundary');
    });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-gradient-warm flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              The app encountered an unexpected error
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-auto max-h-32">
            <p className="text-destructive font-semibold mb-1">{error.name}</p>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => {
              onReset();
              navigate('/');
            }}
            className="flex-1 bg-gradient-ritual"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          If this problem persists, please contact support
        </p>
      </Card>
    </div>
  );
}
