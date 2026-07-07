import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-red-400">Something went wrong</h2>
          <p className="mb-6 text-sm text-red-200/80">
            We encountered an unexpected error while loading this component. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500/20 px-6 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/30"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary