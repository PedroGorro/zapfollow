import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../state/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth(); // se já estiver logado, manda direto
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Se já está logado (ex.: após refresh), redireciona
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSignIn(e) {
    e.preventDefault();
    setMsg("");
    if (!email || !pwd) {
      setMsg("Informe e‑mail e senha.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) throw error;

      // Garante que a sessão foi criada (cobre casos de confirmação de e‑mail exigida)
      // Tenta ler a sessão imediatamente; se ainda não veio, tenta mais algumas vezes rápido.
      let tries = 0;
      let sess = data?.session;
      while (!sess && tries < 5) {
        const { data: s } = await supabase.auth.getSession();
        sess = s?.session || null;
        if (!sess) await new Promise(r => setTimeout(r, 120));
        tries++;
      }

      if (!sess) {
        setMsg(
          "Login realizado, mas a sessão não foi criada. Verifique se a confirmação de e‑mail está exigida nas configurações do Supabase e se o e‑mail foi confirmado."
        );
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMsg(err?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold">Entrar</h1>
        <p className="text-sm text-gray-600 mt-1">
          Acesse sua conta para gerenciar contatos, templates e agendamentos.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
          <div>
            <label className="text-sm text-gray-700">E‑mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Senha</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Sua senha"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              autoComplete="current-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

        <div className="mt-4 text-sm flex items-center justify-between">
          <Link to="/reset-password" className="text-purple-700 hover:underline">
            Esqueci minha senha
          </Link>
          <Link to="/" className="text-gray-500 hover:underline">
            Voltar à Home
          </Link>
        </div>
      </div>
    </div>
  );
}
