import React, { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[CALDIM 3D Stage] Three.js Error Boundary caught an exception:', error);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
