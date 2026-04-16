// React Error Boundary component
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Class component to handle error boundary (hooks cannot catch render errors)
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>页面加载失败</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="btn btn-primary"
          >
            返回首页
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper that provides theme context for the fallback UI
export const ErrorBoundaryFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const { colors } = useTheme();
  return (
    <div
      role="alert"
      style={{
        padding: '3rem 1rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        background: colors.bgSecondary,
      }}
    >
      <h2 style={{ marginBottom: '1rem', color: colors.error }}>页面加载失败</h2>
      <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
        {error?.message || '未知错误'}
      </p>
      <button
        onClick={() => (window.location.href = '/')}
        className="btn btn-primary"
      >
        返回首页
      </button>
    </div>
  );
};

export default function ErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundaryClass>{children}</ErrorBoundaryClass>
  );
}
