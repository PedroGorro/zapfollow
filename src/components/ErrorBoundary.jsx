import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // aqui você pode logar no console ou mandar pra algum endpoint seu no futuro
    console.error("UI ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] grid place-items-center p-6">
          <div className="max-w-lg w-full bg-white shadow rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Oops! Algo deu errado.
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Você pode tentar recarregar a página.
            </p>

            <pre className="text-xs bg-gray-50 p-3 rounded mt-4 overflow-auto text-gray-500 text-left">
              {String(this.state.error?.message || "Erro desconhecido")}
            </pre>

            <button
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}