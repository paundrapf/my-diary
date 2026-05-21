import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-bg-primary">
          <div className="text-center px-8">
            <AlertTriangle strokeWidth={1.5} size={40} className="text-text-tertiary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-text-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
