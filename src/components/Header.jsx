import { useAuth } from "../state/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../state/AppStore";

// Pega iniciais do usuário (nome > e-mail)
function getInitials(user) {
  const name = user?.user_metadata?.full_name || "";
  const email = user?.email || "";
  const base = name || email.split("@")[0];
  const parts = base.trim().split(/\s+/);
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return (initials || "US").toUpperCase();
}
function getDisplayName(user) {
  const name = user?.user_metadata?.full_name?.trim();
  if (name) return name.split(" ")[0];
  const email = user?.email || "";
  return email ? email.split("@")[0] : "Usuário";
}

// Plano atual (fallback: Free)
function getPlan(user) {
  return (user?.user_metadata?.plan || "Free").toLowerCase();
}

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { openUpgrade } = useAppStore(); // ✅ chama o modal do Store

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const plan = getPlan(user); // "free" | "pro"
  const planLabel = plan === "pro" ? "Pro" : "Free";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white grid place-items-center text-xs font-extrabold shadow-sm">
            Z
          </div>
          <div className="font-extrabold text-gray-900">ZapFollow</div>
        </div>

        {/* Ações à direita */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Pill do plano */}
            <span
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                plan === "pro"
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
              title="Seu plano atual"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  plan === "pro" ? "bg-purple-600" : "bg-gray-400"
                }`}
              />
              Plano {planLabel}
            </span>

            {/* Botão de upgrade (apenas se Free) */}
            {plan !== "pro" && (
              <button
                onClick={openUpgrade}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                Fazer upgrade
              </button>
            )}

            {/* Saudação */}
            <div className="hidden md:block text-sm text-gray-600">
              Olá, <span className="font-semibold text-gray-900">{getDisplayName(user)}</span>
            </div>

            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full bg-purple-600 text-white grid place-items-center text-xs font-bold"
              aria-label="Avatar do usuário"
              title={user?.email || "Conta"}
            >
              {getInitials(user)}
            </div>

            {/* Sair */}
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              aria-label="Sair da conta"
              title="Sair"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
