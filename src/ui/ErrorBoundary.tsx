import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { clearAllData } from '../state/storage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleClearData = () => {
    clearAllData();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We apologize for the inconvenience. An unexpected error occurred.</p>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button onClick={this.handleReload}>Reload</button>
            <button className="danger" onClick={this.handleClearData}>Clear saved data and reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
