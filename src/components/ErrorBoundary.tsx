import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.'
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AgroVision ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Something went wrong while loading this view. Your saved local field data remains intact.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && parsed.operationType && parsed.error) {
          friendly = `Database sync (${parsed.operationType}) could not complete: ${parsed.error}. You can continue safely with local mode or sign back in.`;
        }
      } catch {
        // Plain error message
      }

      return (
        <div className="min-h-screen bg-[#faf8f2] text-[#13281c] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl bg-white border border-[#cbdcd0] p-6 shadow-md space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] border border-[#fcd34d] text-[#b45309] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-lg font-extrabold text-[#13281c]">
              AgroVision Recovery Mode
            </h1>
            <p className="text-xs text-[#3d5947] leading-relaxed">{friendly}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload AgroVision AI</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
