import { useMemo, useState } from "react";
import { FaUserPlus, FaWhatsapp, FaCalendarAlt } from "react-icons/fa";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Chart as ChartJS } from "chart.js/auto";
import { CenterTextPlugin } from "../utils/chartCenterText";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import { useAppStore } from "../state/AppStore";

// === Modais ===
import ContatoModal from "../components/ContatoModal";
import TemplateModal from "../components/TemplateModal";
import AgendamentoModal from "../components/AgendamentoModal";
import OnboardingBar from "../components/OnboardingBar";
import Tour from "../components/Tour";


// registra plugin para texto central (opcional, fica pronto)
ChartJS.register(CenterTextPlugin);

/** ===========================
 *  Paleta unificada (guia visual)
 *  =========================== */
const BRAND = {
  purple: "#6C63FF",
  green: "#00C49F",
  yellow: "#FACC15",
  red: "#EF4444",
  blue: "#3B82F6",
  neutral: "#94A3B8",
};
const chartColors = [BRAND.purple, BRAND.green, BRAND.yellow, BRAND.red, BRAND.blue];

/** Cores fixas por status (coerente com chips/listas) */
const STATUS_COLORS = {
  Inativo: BRAND.neutral, // perdas/desistências
  Perdido: BRAND.red,
  Novo: BRAND.blue,
  "Primeiro contato feito": BRAND.purple,
  "Em negociação": BRAND.yellow,
  Cliente: "#22C55E", // emerald-500
};

// barras auxiliares
const PALETTE = [BRAND.purple, BRAND.green, BRAND.blue, BRAND.yellow, BRAND.red];

/** Helpers período */
function daysFor(periodo) {
  if (periodo === "today") return 1;
  if (periodo === "30d") return 30;
  return 7;
}
function inPeriod(d, start, end) {
  if (!(d instanceof Date) || isNaN(d)) return false;
  return d >= start && d <= end;
}

export default function Dashboard() {
  const {
    contatos,
    agendamentos,
    templates,
    addContato,
    saveTemplate,
    saveAgendamento,
  } = useAppStore();

  const [periodo, setPeriodo] = useState("7d");

  // estados dos modais
  const [openContato, setOpenContato] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [openAgendamento, setOpenAgendamento] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);


  // janela do período
  const { start, end } = useMemo(() => {
    const dias = daysFor(periodo);
    const now = new Date();
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    s.setDate(now.getDate() - (dias - 1));
    return { start: s, end: now };
  }, [periodo]);

  // KPIs do período
  const kpisPeriod = useMemo(() => {
    const contatosPeriodo = contatos.filter((c) =>
      inPeriod(new Date(c.created_at || c.updated_at || c.ultima_acao), start, end)
    );

    const agPeriodo = agendamentos.filter((a) => inPeriod(new Date(a.quando), start, end));

    const enviadosPeriodo = agendamentos.filter((a) => {
      if (a.status === "Pendente") return false;
      const ref = new Date(a.updated_at || a.quando);
      return inPeriod(ref, start, end);
    });

    const atrasadas = agPeriodo.filter(
      (a) => a.status === "Pendente" && new Date(a.quando) < end
    ).length;

    const pendentesPeriodo = agPeriodo.filter((a) => a.status === "Pendente").length;

    const clientesPeriodo = contatosPeriodo.filter((c) => c.status === "Cliente").length;
    const taxaConversao =
      Math.round(((clientesPeriodo / Math.max(contatosPeriodo.length, 1)) * 100 + Number.EPSILON) * 10) / 10;

    const perdasPeriodo = contatosPeriodo.filter(
      (c) => c.status === "Inativo" || c.status === "Perdido"
    ).length;

    return {
      novosContatos: contatosPeriodo.length,
      mensagensEnviadas: enviadosPeriodo.length,
      agendamentosCount: agPeriodo.length,
      taxaConversao,
      clientesPeriodo,
      perdasPeriodo,
      atrasadas,
      pendentesPeriodo,
      statusDistrib: contatosPeriodo.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [contatos, agendamentos, start, end]);

  // Gráfico linha — mensagens enviadas por dia
  const lineData = useMemo(() => {
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    agendamentos.forEach((a) => {
      if (a.status !== "Pendente") {
        const ref = new Date(a.updated_at || a.quando);
        if (!inPeriod(ref, start, end)) return;
        const dow = (ref.getDay() + 6) % 7; // seg=0 ... dom=6
        counts[dow] += 1;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Mensagens enviadas",
          data: counts,
          borderColor: BRAND.purple,
          backgroundColor: "rgba(108, 99, 255, 0.15)",
          fill: false,
          tension: 0.3,
        },
      ],
    };
  }, [agendamentos, start, end]);

  const lineHasData = useMemo(
    () => (lineData?.datasets?.[0]?.data || []).some((v) => v > 0),
    [lineData]
  );

  // Pizza — distribuição status
  const doughnutData = useMemo(() => {
    const labels = Object.keys(kpisPeriod.statusDistrib || {});
    const data = Object.values(kpisPeriod.statusDistrib || {});
    const backgroundColor = labels.map((name) => STATUS_COLORS[name] || BRAND.neutral);
    return {
      labels,
      datasets: [
        {
          label: "Contatos",
          data,
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  }, [kpisPeriod.statusDistrib]);

  const doughnutTotal = useMemo(
    () => (doughnutData?.datasets?.[0]?.data || []).reduce((a, b) => a + b, 0),
    [doughnutData]
  );

  // Barras horizontais — Top templates usados
  const topTemplates = useMemo(() => {
    const map = new Map(); // label -> count
    agendamentos.forEach((a) => {
      const ref = new Date(a.updated_at || a.quando);
      if (!inPeriod(ref, start, end)) return;
      const id = a.template_id ?? a.templateId ?? null;
      const label =
        id == null
          ? "Personalizada"
          : templates.find((t) => t.id === id)?.titulo || `Template #${id}`;
      map.set(label, (map.get(label) || 0) + 1);
    });

    const pairs = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const labels = pairs.map((p) => p[0]);
    const values = pairs.map((p) => p[1]);

    return {
      labels,
      datasets: [
        {
          label: "Envios no período",
          data: values,
          backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 10,
          maxBarThickness: 28,
        },
      ],
    };
  }, [agendamentos, templates, start, end]);

  const topTemplatesOptions = useMemo(
    () => ({
      indexAxis: "y",
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(0,0,0,0.06)" } },
        y: { grid: { display: false } },
      },
    }),
    []
  );

  // Últimos contatos
  const ultimosContatos = useMemo(() => {
    return contatos
      .filter((c) => inPeriod(new Date(c.ultima_acao || c.updated_at || c.created_at), start, end))
      .sort((a, b) => (a.ultima_acao < b.ultima_acao ? 1 : -1))
      .slice(0, 5);
  }, [contatos, start, end]);

  // ===== Handlers dos modais =====
  async function handleSalvarContato(payload) {
    await addContato(payload);
    setOpenContato(false);
  }
  async function handleSalvarTemplate(payload) {
    await saveTemplate(payload);
    setOpenTemplate(false);
  }
  async function handleSalvarAgendamento(payload) {
    await saveAgendamento(payload);
    setOpenAgendamento(false);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header do dashboard */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Visão geral do seu funil e atividades.</p>
        </div>
        <select
          className="border rounded-xl px-3 py-2 bg-white text-gray-700"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="today">Hoje</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </select>
      </div>

      <OnboardingBar onOpenTour={() => setTourOpen(true)} />
<Tour open={tourOpen} onClose={() => setTourOpen(false)} />


      {/* KPIs — linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<FaUserPlus />} label="Novos contatos" value={kpisPeriod.novosContatos} accent="purple" />
        <StatCard icon={<FaWhatsapp />} label="Mensagens enviadas" value={kpisPeriod.mensagensEnviadas} accent="green" />
        <StatCard icon={<FaCalendarAlt />} label="Agendamentos" value={kpisPeriod.agendamentosCount} accent="purple" />
        <StatCard icon={<span className="font-semibold">%</span>} label="Taxa de conversão" value={`${kpisPeriod.taxaConversao}%`} accent="yellow" />
      </div>

      {/* KPIs — linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<FaUserPlus />}   label="Clientes (conversões)" value={kpisPeriod.clientesPeriodo} accent="purple" />
        <StatCard icon={<FaCalendarAlt />} label="Perdas / desistências" value={kpisPeriod.perdasPeriodo}   accent="red" />
        <StatCard icon={<FaWhatsapp />}    label="Pendentes"             value={kpisPeriod.pendentesPeriodo} accent="green" />
        <StatCard icon={<FaCalendarAlt />} label="Atrasadas"             value={kpisPeriod.atrasadas}        accent="yellow" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Tendência de mensagens</h3>
          </div>
          {lineHasData ? (
            <Line
              data={lineData}
              options={{ plugins: { centerText: { text: "" } } }}
            />
          ) : (
            <EmptyState
              title="Ainda sem envios"
              description="Quando você começar a marcar envios, mostramos a tendência aqui."
              primaryAction={{ label: "Novo agendamento", to: "/agendamentos" }}
              secondaryAction={{ label: "Ver contatos", to: "/contatos", variant: "outline" }}
              className="shadow-none"
            />
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição por status</h3>
          {doughnutTotal > 0 ? (
            <Doughnut
              data={doughnutData}
              options={{ plugins: { centerText: { text: "" } } }}
            />
          ) : (
            <EmptyState
              title="Sem contatos ainda"
              description="Adicione seu primeiro contato para ver a distribuição por status."
              primaryAction={{ label: "Novo contato", to: "/contatos" }}
             
              className="shadow-none"
            />
          )}

          {doughnutTotal > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2 text-sm text-gray-600">
              {Object.entries(kpisPeriod.statusDistrib || {}).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos contatos + coluna direita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Últimos contatos</h3>
          <div className="overflow-x-auto">
            {ultimosContatos.length === 0 ? (
              <EmptyState
                title="Nenhum contato no período"
                description="Crie um contato e já agende o primeiro follow‑up."
                primaryAction={{ label: "+ Novo contato", onClick: () => setOpenContato(true) }}
                secondaryAction={{ label: "Criar template de mensagem", to: "/mensagens", variant: "outline" }}
                className="shadow-none"
              />
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Telefone</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Última ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosContatos.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2">{c.nome}</td>
                      <td className="px-4 py-2">{c.telefone}</td>
                      <td className="px-4 py-2">{c.status}</td>
                      <td className="px-4 py-2">
                        {c.ultima_acao
                          ? new Date(c.ultima_acao).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top templates usados</h3>
            {topTemplates.labels.length ? (
              <Bar data={topTemplates} options={topTemplatesOptions} />
            ) : (
              <EmptyState
                title="Sem envios com templates"
                description="Quando você enviar mensagens com templates, mostramos o ranking aqui."
                primaryAction={{ label: "Criar template", onClick: () => setOpenTemplate(true) }}
                secondaryAction={{ label: "Novo agendamento", onClick: () => setOpenAgendamento(true), variant: "outline" }}
                className="shadow-none"
              />
            )}
          </div>

          {/* Atalhos -> abrem os modais */}
          <button
            className="bg-purple-600 text-white w-full px-4 py-3 rounded-xl shadow hover:shadow-md hover:bg-purple-700 transition"
            onClick={() => setOpenContato(true)}
          >
            + Novo contato
          </button>
          <button
            className="bg-white border border-gray-200 text-gray-700 w-full px-4 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
            onClick={() => setOpenTemplate(true)}
          >
            Nova mensagem
          </button>
          <button
            className="bg-white border border-gray-200 text-gray-700 w-full px-4 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
            onClick={() => setOpenAgendamento(true)}
          >
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Modais (montados no Dashboard) */}
      <ContatoModal
        open={openContato}
        onClose={() => setOpenContato(false)}
        onSave={handleSalvarContato}
      />

      <TemplateModal
        open={openTemplate}
        onClose={() => setOpenTemplate(false)}
        onSave={handleSalvarTemplate}
      />

      <AgendamentoModal
        open={openAgendamento}
        onClose={() => setOpenAgendamento(false)}
        onSave={handleSalvarAgendamento}
        contatos={contatos}     // popula o select de contatos
        templates={templates}   // popula o select de templates
      />
    </div>
  );
}
