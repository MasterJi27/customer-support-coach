import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function isLightTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light'
}

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
    const isLight = isLightTheme()
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-red-100' : 'bg-red-500/15'}`}>
            <AlertTriangle className={`w-7 h-7 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
          </div>
          <h2 className={`text-lg font-bold mb-1 ${isLight ? 'text-navy-800' : 'text-white'}`}>Something went wrong</h2>
          <p className={`text-sm mb-4 ${isLight ? 'text-navy-400' : 'text-white/50'}`}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={this.handleReset} className="btn-primary !px-4 !py-2.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
            <button onClick={() => window.location.reload()} className={`btn-secondary !px-4 !py-2.5 text-xs ${isLight ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''}`}>
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
