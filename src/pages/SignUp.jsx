// src/pages/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setInfo("");

    if (!fullName.trim() || !email.trim() || !pass.trim()) {
      setInfo("Preencha nome, e‑mail e senha.");
      return;
    }
    if (pass.length < 8) {
      setInfo("A senha precisa ter ao menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      // URL usada quando a confirmação por e‑mail estiver LIGADA
      const redirect = `${window.location.origin}/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          emailRedirectTo: redirect,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      // Se confirmação por e‑mail estiver LIGADA, data.session === null
      if (!data.session) {
        setInfo(
          "Conta criada! Enviamos um e‑mail de confirmação. Clique no link para ativar sua conta."
        );
        return;
      }

      // Se confirmação por e‑mail estiver DESLIGADA, já estaremos logados
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setInfo(err.message || "Não foi possível criar sua conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-violet-100 p-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Criar conta
          </h1>
          <p className="text-gray-500 mt-2">
            Comece grátis — sem cartão de crédito.
          </p>

          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nome
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                autoComplete="name"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E‑mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 transition disabled:opacity-50 shadow-md shadow-violet-600/20"
            >
              {submitting ? "Criando sua conta..." : "Criar conta grátis"}
            </button>

            {info && (
              <div className="rounded-2xl border border-violet-100 bg-violet-50 text-violet-900 text-sm p-3">
                {info}
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-700 hover:text-violet-800 hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Ao criar uma conta, você concorda com nossos Termos e Política de
          Privacidade.
        </p>
      </div>
    </div>
  );
}
