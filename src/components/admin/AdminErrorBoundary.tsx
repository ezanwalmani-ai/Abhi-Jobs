import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminErrorBoundaryProps {
  resetKey: string;
  sectionLabel?: string;
  onReset?: () => void;
  children: React.ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AdminErrorBoundary extends React.Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  declare props: Readonly<AdminErrorBoundaryProps>;
  state: AdminErrorBoundaryState;
  declare setState: (state: Partial<AdminErrorBoundaryState>) => void;

  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): AdminErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'An unexpected display error occurred in this admin view.';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[AdminErrorBoundary] Caught error in admin section:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: AdminErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-rose-200 p-6 sm:p-8 max-w-xl mx-auto my-6 space-y-3 text-center">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#081D36]">
            Unable to render {this.props.sectionLabel || 'this view'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed break-words">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
