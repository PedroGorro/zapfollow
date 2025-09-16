// src/pages/LandingPsicologos.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaClock, FaComments, FaShieldAlt, FaQuoteLeft } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function LandingPsicologos() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLead(e) {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const origem = "lp-psicologos";
      const { error } = await supabase.from("leads").insert([{ email, nome, origem }]);
      if (error) throw error;
      toast.success("Recebido! Entraremos em contato com novidades.");
      setEmail("");
      setNome("");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar seu e-mail agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">ZapFollow</Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900">Entrar</Link>
            <Link
              to="/signup.jsx"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
            >
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Reduza faltas e aumente a adesão dos seus pacientes
              <span className="block text-purple-600">com lembretes automáticos no WhatsApp.</span>
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Agende sessões em segundos, automatize lembretes e foque no que importa: cuidar dos seus pacientes.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                to="/login"
                className="px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              >
                Criar conta grátis
              </Link>
              <a
                href="#como-funciona"
                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Ver como funciona
              </a>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>

          {/* Mock visual */}
          <div className="relative">
            <div className="rounded-2xl border bg-white shadow-md p-4">
              <div className="h-6 bg-gray-100 rounded mb-3 w-1/3" />
              <div className="space-y-2">
                <div className="h-10 bg-purple-50 rounded flex items-center px-3 text-sm text-purple-700">
                  “Olá, lembrando que sua sessão é amanhã às 18h. Responda 1 para confirmar.”
                </div>
                <div className="h-10 bg-green-50 rounded flex items-center px-3 text-sm text-green-700">
                  “Confirmado! Nos vemos amanhã. 😊”
                </div>
                <div className="h-10 bg-gray-50 rounded flex items-center px-3 text-sm text-gray-700">
                  Sessão: 18:00 · João Silva
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden sm:block rounded-2xl border bg-white shadow p-3 w-48">
              <div className="text-xs text-gray-500">Próxima sessão</div>
              <div className="text-sm font-medium text-gray-900">Amanhã, 18:00</div>
              <div className="text-xs text-gray-500">João Silva</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-3 gap-6">
          <Benefit
            icon={<FaComments />}
            title="Menos faltas"
            desc="Envio automático de lembretes no WhatsApp — antes e no dia da sessão."
          />
          <Benefit
            icon={<FaClock />}
            title="Agenda organizada"
            desc="Visual simples do dia e da semana. Nada de planilhas confusas."
          />
          <Benefit
            icon={<FaShieldAlt />}
            title="Sigilo respeitado"
            desc="Dados protegidos e mensagem com linguagem neutra e profissional."
          />
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-gray-900">Como funciona</h2>
          <div className="mt-6 grid md:grid-cols-4 gap-4">
            {[
              ["Cadastre pacientes", "Importe ou adicione manualmente seus contatos."],
              ["Agende sessões", "Dia e horário locais, em poucos cliques."],
              ["Lembretes automáticos", "WhatsApp envia a mensagem no momento certo."],
              ["Confirmação fácil", "Você acompanha e reduz ausências."],
            ].map(([t, d], i) => (
              <Step key={i} num={i + 1} title={t} desc={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Prova social padronizada */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900">Profissionais em acesso antecipado</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {[
            [
              "“Antes eu perdia até 5 sessões por mês por falta de comparecimento. Com o ZapFollow, as ausências caíram pela metade.”",
              "Psicóloga clínica",
            ],
            [
              "“Com os lembretes automáticos, consegui reduzir em 40% as faltas no meu consultório. O sistema é simples e me dá tranquilidade.”",
              "Terapeuta TCC",
            ],
            [
              "“Economizo pelo menos 30 minutos por dia que antes gastava confirmando sessões no WhatsApp. Agora posso focar no atendimento.”",
              "Psicólogo infantil",
            ],
            [
              "“O custo se paga na primeira sessão recuperada. É prático, direto e respeita a ética do consultório.”",
              "Terapeuta Integrativa",
            ],
          ].map(([txt, autor], i) => (
            <Testimonial key={i} text={txt} author={autor} />
          ))}
        </div>
      </section>

      {/* Feito para psicologia (expandido) */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900">Feito para psicologia</h2>
        <ul className="mt-6 grid md:grid-cols-2 gap-4 text-gray-700">
          {[
            "Templates prontos de lembrete com linguagem ética (sem conteúdo sensível).",
            "Histórico de lembretes e respostas por paciente (acompanhamento simples).",
            "Lembretes configuráveis (véspera e dia) e mensagem de reforço opcional.",
            "Campos para link de sessão online (Meet/Zoom) ou endereço presencial.",
            "Confirmação rápida do paciente (ex.: responder 1 para confirmar).",
            "Agenda do dia/semana com destaques de pendências e atrasos.",
            "Atalhos para WhatsApp e registro do status pós-sessão.",
            "Multi-dispositivo: acesse do computador ou notebook sem instalar nada.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-purple-600">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ (expandido) */}
      <section id="faq" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900">Perguntas frequentes</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {[
            ["Meus pacientes precisam instalar algo?", "Não. Eles recebem os lembretes diretamente no WhatsApp, sem apps adicionais."],
            ["É compatível com sessões online?", "Sim. Você pode inserir links de Google Meet, Zoom ou outro na mensagem."],
            ["E quanto à confidencialidade?", "As mensagens são neutras e configuráveis, sem citar diagnósticos. Todos os dados ficam protegidos."],
            ["Preciso de WhatsApp Business?", "Não. Funciona com qualquer conta de WhatsApp ativa."],
            ["Posso cancelar quando quiser?", "Sim. Não há fidelidade nem multa. Você pode cancelar direto no sistema."],
            ["Consigo personalizar dias/horários dos lembretes?", "Sim. Você escolhe a antecedência e pode ajustar a linguagem do texto."],
            ["Serve para equipes/secretariado?", "Sim. Você pode compartilhar o acesso com quem agenda para você."],
            ["Posso importar meus contatos atuais?", "Sim. Você pode cadastrar manualmente ou importar gradualmente enquanto usa."],
            ["Há plano gratuito de teste?", "Sim. Você pode começar grátis e só pagar quando decidir continuar."],
            ["O sistema está adequado à ética/LGPD?", "O produto evita conteúdo sensível por padrão e mantém dados em ambiente seguro. Use linguagem neutra nas mensagens."],
          ].map(([q, a], i) => (
            <div key={i} className="border rounded-xl p-4 bg-white shadow-sm">
              <h3 className="font-semibold text-gray-900">{q}</h3>
              <p className="text-sm text-gray-600 mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA repetido */}
      <section className="bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h3 className="text-2xl font-bold text-white">Reduza faltas e organize sua agenda hoje mesmo</h3>
          <p className="text-purple-100 mt-1">Teste grátis. Sem cartão de crédito. Fácil de cancelar.</p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-white text-purple-700 font-medium hover:bg-purple-50"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </section>

      {/* Captura de e-mail */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900">Receba dicas para reduzir faltas</h4>
          <p className="text-gray-600 text-sm">Guia prático de organização e lembretes para psicólogos.</p>
          <form onSubmit={handleLead} className="mt-4 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border rounded-xl px-3 py-2"
              aria-label="Seu nome"
            />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-xl px-3 py-2"
              aria-label="Seu e-mail"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Quero receber"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Prometemos não enviar spam. Você pode sair quando quiser.
          </p>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} ZapFollow</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-gray-700">Entrar</Link>
            <a href="#faq" className="hover:text-gray-700">FAQ</a>
            <a href="/#privacidade" className="hover:text-gray-700">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Benefit({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 grid place-items-center text-lg">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="w-8 h-8 rounded-full bg-purple-600 text-white grid place-items-center text-sm font-bold">
        {num}
      </div>
      <h4 className="mt-3 font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </div>
  );
}

function Testimonial({ text, author }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm h-full flex flex-col">
      <FaQuoteLeft className="text-purple-400 text-lg" />
      <p className="text-gray-800 italic mt-2 flex-1">{text}</p>
      <p className="mt-3 text-sm text-gray-500">— {author} (acesso antecipado)</p>
    </div>
  );
}
