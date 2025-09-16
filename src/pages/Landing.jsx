import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBolt, FaCalendarCheck, FaWhatsapp, FaMagic, FaCheckCircle,
  FaArrowRight, FaShieldAlt, FaThumbsUp, FaChartLine, FaUsers,
  FaRoad, FaPlug, FaRobot, FaCogs
} from "react-icons/fa";

/**
 * ZapFollow – Landing Page
 * - Responsiva, acessível e leve
 * - CTA sempre visível
 * - Conteúdo orientado a benefícios
 * - Agora com seção "O que vem por aí" (roadmap) + FAQ sobre API do WhatsApp Business
 */
export default function Landing() {
  const logos = useMemo(
    () => ["Marcenaria", "Clínica Estética", "Serralheria", "Agência", "Assistência Técnica"],
    []
  );

  // FAQ EXPANDIDA (11 itens, incluindo API WhatsApp Business)
  const faqs = [
    {
      q: "Como o ZapFollow ajuda a fechar mais orçamentos?",
      a: "Você salva mensagens que funcionam, cria lembretes de follow‑up e manda no WhatsApp em um clique. O sistema lembra você de voltar no cliente na hora certa — nada fica perdido."
    },
    {
      q: "Preciso instalar algo no celular?",
      a: "Não. O ZapFollow roda no navegador e abre o WhatsApp Web com a mensagem pronta."
    },
    {
      q: "Posso usar com minha equipe?",
      a: "Sim. Começamos com login por usuário. Em breve, times e permissões para trabalhar em conjunto."
    },
    {
      q: "Meus dados ficam seguros?",
      a: "Sim. Usamos Supabase (Postgres + Auth) com políticas RLS para isolar seus dados por usuário e boas práticas de segurança."
    },
    {
      q: "O ZapFollow substitui meu CRM atual?",
      a: "Não necessariamente. Ele pode complementar seu CRM (foco em follow‑ups no WhatsApp) ou ser usado sozinho por quem quer algo simples e direto."
    },
    {
      q: "Posso personalizar as mensagens automáticas?",
      a: "Sim. Você cria templates por categoria (ex.: Orçamento, Lembrete, Agradecimento, Reengajamento) e usa placeholders como {{nome}}."
    },
    {
      q: "Funciona em qualquer segmento de negócio?",
      a: "Sim! Qualquer operação que vende por WhatsApp se beneficia: serviços, orçamentos, assistência técnica, clínicas, agências etc."
    },
    {
      q: "Consigo testar antes de assinar?",
      a: "Sim. Você pode criar sua conta e testar gratuitamente por um período para validar na prática."
    },
    {
      q: "O sistema envia mensagens em massa?",
      a: "Não. Evitamos SPAM. A proposta é manter conversas humanas e relevantes, com lembretes que ajudam você a dar retorno no momento certo."
    },
    {
      q: "Qual é o suporte oferecido?",
      a: "Atendemos por WhatsApp e e‑mail. Ajudamos no onboarding e em dúvidas do dia a dia."
    },
    {
      q: "ZapFollow terá integração direta com o WhatsApp Business API?",
      a: "Hoje você já envia mensagens em 1 clique pelo WhatsApp Web. Estamos planejando integração oficial com a API do WhatsApp Business para cenários de automação controlada e envio em escala — sempre em conformidade com as políticas da Meta e liberado em fases futuras."
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white grid place-items-center">
              <FaBolt />
            </div>
            <span className="font-extrabold text-lg">ZapFollow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#como-funciona" className="hover:text-slate-600">Como funciona</a>
            <a href="#beneficios" className="hover:text-slate-600">Benefícios</a>
            <a href="#roadmap" className="hover:text-slate-600">Roadmap</a>
            <a href="#faq" className="hover:text-slate-600">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg border hover:bg-slate-50"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-md"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <FaCheckCircle /> Feche mais orçamentos com follow‑ups no tempo certo
            </span>

            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight">
              Templates + Agenda de follow‑ups <span className="text-purple-600">= mais respostas</span>
            </h1>

            <p className="mt-4 text-slate-600 text-lg">
              Salve suas mensagens que convertem, receba lembretes e envie no WhatsApp com um clique.
              Nunca mais perca um retorno por esquecimento.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-lg flex items-center gap-2"
              >
                Começar agora <FaArrowRight />
              </Link>
              <a
                href="#como-funciona"
                className="px-5 py-3 rounded-xl border hover:bg-slate-50"
              >
                Ver como funciona
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-slate-400" /> Dados isolados por usuário
              </div>
              <div className="flex items-center gap-2">
                <FaThumbsUp className="text-slate-400" /> Sem cartão no teste
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-white shadow-xl p-5">
              <div className="grid grid-cols-2 gap-3">
                <FeatureTile
                  icon={<FaMagic />}
                  title="Templates prontos"
                  desc="Mensagens salvas com placeholders como {{nome}}."
                />
                <FeatureTile
                  icon={<FaCalendarCheck />}
                  title="Agenda inteligente"
                  desc="Lembretes no horário local. Atrasado? Nós destacamos."
                />
                <FeatureTile
                  icon={<FaWhatsapp />}
                  title="1‑clique WhatsApp"
                  desc="Abre o WhatsApp com texto pronto e contato certo."
                />
                <FeatureTile
                  icon={<FaChartLine />}
                  title="KPI simples"
                  desc="Taxa de resposta e pendências em um painel limpo."
                />
              </div>
            </div>
          </div>
        </div>

        {/* “Prova social” leve */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <p className="text-xs uppercase tracking-widest text-slate-400 text-center">
            Feito para quem vive de orçamento e resposta
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 md:gap-8 text-slate-400">
            {logos.map((n) => (
              <span key={n} className="text-sm">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Benefit
              icon={<FaMagic />}
              title="Templates que convertem"
              desc="Crie uma biblioteca de mensagens por categoria: Orçamento, Lembrete, Agradecimento, Reengajamento."
            />
            <Benefit
              icon={<FaCalendarCheck />}
              title="Follow‑up no tempo certo"
              desc="Defina data/hora local e receba o lembrete. Status inteligente: Pendente, Atrasado, Enviado, Respondido."
            />
            <Benefit
              icon={<FaWhatsapp />}
              title="WhatsApp em 1 clique"
              desc="Link direto com o texto preparado e telefone formatado. Copiar/colar também está a um clique."
            />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center">
            Em 3 passos você nunca mais esquece um retorno
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            <Step n="01" title="Cadastre contato">
              Nome, telefone e status. Tudo simples e rápido.
            </Step>
            <Step n="02" title="Escolha um template">
              Personalize com <code className="bg-slate-100 px-1 rounded">{"{{nome}}"}</code> e salve.
            </Step>
            <Step n="03" title="Agende o follow‑up">
              Defina data/hora, receba o lembrete e dispare no WhatsApp.
            </Step>
          </div>
        </div>
      </section>

      {/* MÉTRICAS / PROVAS RÁPIDAS */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-3 gap-6">
          <Stat k="+2x" label="chances de resposta" />
          <Stat k="-60%" label="esquecimentos de follow‑up" />
          <Stat k="+30%" label="fechamentos no mês" />
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center">O que vem por aí</h2>
          <p className="mt-3 text-center text-slate-600">
            Transparência total: aqui está o que já estamos desenhando para as próximas fases.
          </p>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RoadmapCard
              icon={<FaRoad />}
              title="API oficial WhatsApp Business"
              desc="Integração em etapas, seguindo as políticas da Meta, para fluxos de envio controlado e automação confiável."
            />
            <RoadmapCard
              icon={<FaCogs />}
              title="Automação leve"
              desc="Regras simples: após X dias sem resposta, sugerir novo toque, mudar status ou agendar lembrete automaticamente."
            />
            <RoadmapCard
              icon={<FaPlug />}
              title="Integrações"
              desc="Conexões com planilhas/CRM para importar contatos/atividades e levar seus dados onde fizer sentido."
            />
            <RoadmapCard
              icon={<FaRobot />}
              title="Assistentes & Insights"
              desc="Sugestões de template, variações de mensagem e insights de timing para aumentar sua taxa de resposta."
            />
          </div>
        </div>
      </section>

      {/* CHAMADA */}
      <section className="bg-gradient-to-r from-purple-600 to-violet-600">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold">Pronto para fechar mais orçamentos?</h3>
          <p className="mt-2 text-white/90">
            Crie sua conta grátis. Importe templates e agende seu primeiro follow‑up agora.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-3 rounded-xl bg-white text-purple-700 hover:bg-slate-100"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 rounded-xl border border-white/40 hover:bg-white/10"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center">Perguntas frequentes</h3>
          <div className="mt-8 divide-y">
            {faqs.map((f, i) => (
              <button
                key={f.q}
                className="w-full text-left py-4"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{f.q}</span>
                  <span className="text-slate-400">{open === i ? "−" : "+"}</span>
                </div>
                {open === i && (
                  <p className="mt-2 text-slate-600">{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <FaUsers /> Feito para SMBs — serviços e orçamentos
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} ZapFollow. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =============== sub‑componentes =============== */

function FeatureTile({ icon, title, desc }) {
  return (
    <div className="rounded-xl border p-4 hover:shadow-sm transition bg-white">
      <div className="h-9 w-9 rounded-lg bg-purple-600 text-white grid place-items-center">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Benefit({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl border bg-white hover:shadow-sm transition">
      <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 grid place-items-center">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-slate-600">{desc}</p>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Simples e direto</li>
        <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Funciona no seu fluxo</li>
        <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Sem amarras</li>
      </ul>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="p-6 rounded-2xl border bg-white">
      <div className="text-sm font-mono text-slate-400">{n}</div>
      <h4 className="mt-2 font-bold">{title}</h4>
      <p className="mt-2 text-slate-600">{children}</p>
    </div>
  );
}

function Stat({ k, label }) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-center">
      <div className="text-4xl font-extrabold text-purple-600">{k}</div>
      <div className="text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function RoadmapCard({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="h-10 w-10 rounded-xl bg-purple-600/10 text-purple-700 grid place-items-center">
        {icon}
      </div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="text-slate-600 text-sm mt-1">{desc}</p>
    </div>
  );
}
