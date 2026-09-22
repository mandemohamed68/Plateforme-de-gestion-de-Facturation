import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, Sliders } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.setItem('app_current_view', 'dashboard');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetModules = () => {
    try {
      localStorage.removeItem('app_enabled_services_ids');
      localStorage.removeItem('app_hospital_services_config');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 antialiased font-sans">
          <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-black tracking-tight text-white mb-2">
              Une anomalie d'affichage est survenue
            </h1>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Le système a intercepté une erreur de rendu. Vos données et vos sessions sont sécurisées. Vous pouvez réinitialiser la vue ou réactiver les modules par défaut.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/60 rounded-xl p-3.5 mb-6 text-left border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                <span className="font-bold">Erreur :</span> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/50 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Retour Tableau de Bord</span>
              </button>

              <button
                onClick={this.handleResetModules}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-slate-600 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Réactiver tous les modules</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
