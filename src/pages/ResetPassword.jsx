import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasAccessToken = useMemo(
    () => (location.hash || "").includes("access_token="),
    [location.hash]
  );

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // quando cai pelo link, o supabase já injeta a sessão a partir do hash
  useEffect(() => {
    // opcional: limpar mensagens quando muda o modo
    setMsg("");
  }, [hasAccessToken]);

  async function handleSendLink(e) {
    e.preventDefault();
    setMsg("");
    if (!email) return setMsg("Informe seu e‑mail.");
    try {
      setSending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      setMsg("Enviamos um link de redefinição para seu e‑mail.");
    } catch (err) {
      setMsg(err?.message || "Falha ao solicitar redefinição.");
    } finally {
      setSending(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setMsg("");
    if (!pwd || pwd.length < 6) return setMsg("Use ao menos 6 caracteres.");
    if (pwd !== pwd2) return setMsg("As senhas não conferem.");
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      setMsg("Senha alterada com sucesso. Entrando…");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setMsg(err?.message || "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        {!hasAccessToken ? (
          <>
            <h1 className="text-xl font-bold">Redefinir senha</h1>
            <p className="text-sm text-gray-600 mt-1">
              Informe o e‑mail da sua conta para enviarmos o link de redefinição.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSendLink}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2"
              >
                {sending ? "Enviando…" : "Enviar link"}
              </button>
            </form>

            {msg && <p className="mt-3 text-sm">{msg}</p>}

            {sent && (
              <p className="mt-2 text-xs text-gray-500">
                Verifique sua caixa de entrada (e a pasta de spam).
              </p>
            )}

            <div className="mt-6 text-sm">
              <Link to="/login" className="text-purple-700 hover:underline">
                Voltar ao login
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Definir nova senha</h1>
            <p className="text-sm text-gray-600 mt-1">
              Digite sua nova senha para concluir a redefinição.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSetPassword}>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Nova senha"
                className="w-full border rounded-lg px-3 py-2"
                minLength={6}
                required
              />
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="Confirmar nova senha"
                className="w-full border rounded-lg px-3 py-2"
                minLength={6}
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2"
              >
                {saving ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>

            {msg && <p className="mt-3 text-sm">{msg}</p>}

            <div className="mt-6 text-sm">
              <Link to="/login" className="text-purple-700 hover:underline">
                Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
