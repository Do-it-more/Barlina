import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        {/* Development Error Details */}
                        {process.env.NODE_ENV !== 'production' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                                <p className="font-bold mb-1">{this.state.error.toString()}</p>
                                <p className="whitespace-pre-wrap opacity-70">{this.state.errorInfo?.componentStack}</p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                <RefreshCw className="h-5 w-5" />
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Home className="h-5 w-5" />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
