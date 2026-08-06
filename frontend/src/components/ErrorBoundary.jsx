import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Something went wrong</h2>
          <p className="text-sm text-white/50 mb-4">
            {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={this.handleReset} className="btn-primary !px-4 !py-2.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
            <button onClick={() => window.location.reload()} className="btn-secondary !px-4 !py-2.5 text-xs">
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
