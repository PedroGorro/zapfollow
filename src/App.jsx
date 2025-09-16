import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Toasts globais (sucesso/erro/info)
import { Toaster } from "react-hot-toast";

// Layout e componentes
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import UpgradeModal from "./components/UpgradeModal"; // <<< NOVO

// Páginas
import Dashboard from "./pages/Dashboard";
import Contatos from "./pages/Contatos";
import Mensagens from "./pages/Mensagens";
import Agendamentos from "./pages/Agendamentos";
import Landing from "./pages/Landing";
import LandingPsicologos from "./pages/LandingPsicologos";
import SignUp from "./pages/SignUp";

// Auth
import { AuthProvider } from "./state/AuthProvider";
import Protected from "./components/Protected";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

// Store (dentro das rotas privadas)
import { AppStoreProvider, useAppStore } from "./state/AppStore"; // <<< usa useAppStore no layout

// Monitoring (Sentry/LogRocket) + Error Boundary
import { initMonitoring } from "./monitoring/initMonitoring";
import ErrorBoundary from "./components/ErrorBoundary";

// Inicializa telemetria (só terá efeito em produção se envs estiverem preenchidas)
initMonitoring();

// Layout privado com Sidebar fixo + Header
function PrivateLayout({ children }) {
  // lê estado do modal e limites do store
  const { upgradeOpen, closeUpgrade, plan, limits, usage } = useAppStore();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-4 bg-gray-50 min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Modal de upgrade disponível em todas as rotas privadas */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={closeUpgrade}
        plan={plan}
        limits={limits}
        usage={usage}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Público (sem Sidebar/Header) */}
            <Route path="/" element={<Landing />} />
            <Route path="/psicologos" element={<LandingPsicologos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} /> {/* rota de cadastro */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Privado (Auth -> Store -> Layout com Sidebar fixo) */}
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <AppStoreProvider>
                    <PrivateLayout>
                      <Dashboard />
                    </PrivateLayout>
                  </AppStoreProvider>
                </Protected>
              }
            />
            <Route
              path="/contatos"
              element={
                <Protected>
                  <AppStoreProvider>
                    <PrivateLayout>
                      <Contatos />
                    </PrivateLayout>
                  </AppStoreProvider>
                </Protected>
              }
            />
            <Route
              path="/mensagens"
              element={
                <Protected>
                  <AppStoreProvider>
                    <PrivateLayout>
                      <Mensagens />
                    </PrivateLayout>
                  </AppStoreProvider>
                </Protected>
              }
            />
            <Route
              path="/agendamentos"
              element={
                <Protected>
                  <AppStoreProvider>
                    <PrivateLayout>
                      <Agendamentos />
                    </PrivateLayout>
                  </AppStoreProvider>
                </Protected>
              }
            />

            {/* 404 → Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toaster global (alinhado ao guia visual) */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                background: "#ffffff",
                color: "#111827",
                boxShadow:
                  "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              },
              success: { iconTheme: { primary: "#22C55E", secondary: "#ffffff" } },
              error: { iconTheme: { primary: "#EF4444", secondary: "#ffffff" } },
            }}
          />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}
