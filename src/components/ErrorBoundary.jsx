import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-2">Algo deu errado</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ocorreu um erro ao carregar esta parte do aplicativo.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Recarregar página
              </button>
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left bg-gray-100 rounded-xl p-3">
                <summary className="text-[10px] font-bold text-gray-500 cursor-pointer">
                  Detalhes técnicos
                </summary>
                <pre className="text-[8px] text-gray-600 mt-2 overflow-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}