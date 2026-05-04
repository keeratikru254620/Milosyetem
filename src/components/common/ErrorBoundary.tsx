import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white">
          <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
            <div className="luxury-panel rounded-[2rem] border border-white/10 bg-slate-900/90 px-10 py-12 shadow-[0_28px_80px_rgba(15,23,42,0.45)]">
              <h1 className="mb-4 text-4xl font-bold">เกิดข้อผิดพลาด</h1>
              <p className="mb-6 text-base leading-7 text-slate-300">
                แอปพลิเคชันพบปัญหาในการแสดงผล กรุณารีเฟรชหน้าจอหรือกลับมาใหม่อีกครั้ง
              </p>
              <button
                className="metal-button-primary h-14 rounded-[1.2rem] px-8 text-lg font-semibold"
                onClick={this.handleReload}
                type="button"
              >
                โหลดอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
