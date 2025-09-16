// src/pages/Agendamentos.jsx
import { useMemo, useState } from "react";
import {
  FaPlus,
  FaCopy,
  FaWhatsapp,
  FaEdit,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AgendamentoModal from "../components/AgendamentoModal";
import { useAppStore } from "../state/AppStore";
import { STATUS_OPERACIONAL_COLORS, ENVIADO_STATES } from "../constants/status";
import EmptyState from "../components/EmptyState";

const nomeRegex = /\{\{\s*nome\s*\}\}/gi;

function abrirWhatsApp(telefone, mensagem) {
  const link = `https://wa.me/${(telefone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    mensagem || ""
  )}`;
  window.open(link, "_blank");
}

export default function Agendamentos() {
  const {
    contatos,
    templates,
    agendamentos,
    saveAgendamento,
    removeAgendamento,
    marcarAgendamentoEnviado,
  } = useAppStore();

  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("hoje");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const getContato = (id) => contatos.find((c) => c.id === id);

  const agora = new Date();
  const inicioHoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );
  const fimHoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    23,
    59,
    59
  );

  const filtrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return agendamentos
      .filter((a) => {
        const contatoId = a.contato_id ?? a.contatoId; // compat snake/camel
        const contato = getContato(contatoId);
        const nomeMatch =
          !term ||
          (contato?.nome || "").toLowerCase().includes(term) ||
          (contato?.telefone || "").includes(term);
        const dt = new Date(a.quando);
        const tabMatch =
          (aba === "hoje" && dt >= inicioHoje && dt <= fimHoje) ||
          (aba === "proximos" && dt > fimHoje) ||
          (aba === "passados" && dt < inicioHoje);
        return nomeMatch && tabMatch;
      })
      .sort((a, b) => (a.quando > b.quando ? 1 : -1));
  }, [agendamentos, aba, busca, contatos]);

  // salvar (criar/editar)
  async function handleSalvar(ag) {
    await saveAgendamento(ag);
    setModalAberto(false);
    setEditando(null);
  }

  async function handleExcluir(id) {
    if (!window.confirm("Deseja excluir este agendamento?")) return;
    try {
      await toast.promise(removeAgendamento(id), {
        loading: "Excluindo agendamento...",
        success: "Agendamento excluído.",
        error: "Erro ao excluir agendamento.",
      });
    } catch (e) {
      console.error(e);
    }
  }

  // 🔁 Agora o handler usa a MESMA lógica de "enviado" usada no UI
  async function handleMarcarEnviado(ag, isEnviadoFlag) {
    const desfazer = !!isEnviadoFlag; // se já está "enviado" (em qualquer estado enviado), desfaz
    await marcarAgendamentoEnviado(ag.id, desfazer);
  }

  function handleCopiar(texto) {
    navigator.clipboard.writeText(texto || "");
    toast.success("Mensagem copiada.");
  }

  const isEmpty = filtrados.length === 0;

  const vazioTitulo =
    aba === "hoje"
      ? "Nenhum follow-up para hoje"
      : aba === "proximos"
      ? "Nenhum follow-up programado"
      : "Nenhum follow-up passado";

  const vazioDesc =
    aba === "hoje"
      ? "Crie um agendamento para hoje e aumente seu fechamento."
      : aba === "proximos"
      ? "Programe seus próximos follow-ups para manter o ritmo."
      : "Nada no histórico deste período.";

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
          <p className="text-sm text-gray-500">
            Gerencie seus follow-ups por data e status.
          </p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700 flex items-center gap-2"
        >
          <FaPlus /> <span className="hidden sm:inline">Novo agendamento</span>
        </button>
      </div>

      {/* Abas + busca */}
      <div className="flex items-center gap-2">
        {[
          { key: "hoje", label: "Hoje" },
          { key: "proximos", label: "Próximos" },
          { key: "passados", label: "Passados" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setAba(t.key)}
            className={`px-3 py-1.5 rounded-xl border transition ${
              aba === t.key
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar contato..."
          className="ml-auto border rounded-xl px-3 py-1.5 w-full sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-5 py-3 text-left w-40">Quando</th>
              <th className="px-5 py-3 text-left w-56">Contato</th>
              <th className="px-5 py-3 text-left">Mensagem (preview)</th>
              <th className="px-5 py-3 text-left w-40">Status</th>
              <th className="px-5 py-3 text-center w-[240px] lg:w-[280px]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td className="p-0" colSpan={5}>
                  <EmptyState
                    title={vazioTitulo}
                    description={vazioDesc}
                    primaryAction={{
                      label: "Novo agendamento",
                      onClick: () => {
                        setEditando(null);
                        setModalAberto(true);
                      },
                    }}
                    secondaryAction={{
                      label: "Ver contatos",
                      to: "/contatos",
                      variant: "outline",
                    }}
                    className="rounded-none shadow-none"
                  />
                </td>
              </tr>
            ) : (
              filtrados.map((a) => {
                const contatoId = a.contato_id ?? a.contatoId;
                const c = getContato(contatoId);
                const dt = new Date(a.quando);
                const preview = (a.mensagem || "").replace(
                  nomeRegex,
                  c?.nome || "Cliente"
                );

                // badge visual: "Atrasado" se pendente e passou do horário
                const baseLabel =
                  a.status === "Pendente" && dt < new Date()
                    ? "Atrasado"
                    : a.status;

                const statusCls =
                  STATUS_OPERACIONAL_COLORS[baseLabel] ||
                  "bg-gray-100 text-gray-700";

                // ✅ “Enviado” = próprio "Enviado" OU qualquer estado do grupo ENVIADO_STATES
                const statusNorm = (a.status || "").trim().toLowerCase();
                const isEnviado =
                  statusNorm === "enviado" ||
                  ENVIADO_STATES.some(
                    (s) => (s || "").toLowerCase() === statusNorm
                  );

                return (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-gray-50 align-top"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      {dt.toLocaleDateString("pt-BR")}{" "}
                      {dt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {c?.nome || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {c?.telefone || ""}
                      </div>
                    </td>

                    <td
                      className="px-5 py-3 whitespace-pre-wrap"
                      title={preview}
                    >
                      {preview}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusCls}`}
                        title={baseLabel}
                        style={{
                          whiteSpace: "nowrap",
                          display: "inline-block",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                        }}
                      >
                        {baseLabel}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="grid grid-cols-2 gap-2 justify-items-stretch">
                        <button
                          className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white grid place-items-center"
                          onClick={() =>
                            abrirWhatsApp(c?.telefone || "", preview)
                          }
                          title="Abrir WhatsApp"
                          aria-label="Abrir WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>

                        <button
                          className="h-9 rounded-lg bg-gray-100 hover:bg-gray-200 grid place-items-center"
                          onClick={() => handleCopiar(preview)}
                          title="Copiar mensagem"
                          aria-label="Copiar mensagem"
                        >
                          <FaCopy />
                        </button>

                        <button
                          className="h-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white grid place-items-center"
                          onClick={() => {
                            setEditando(a);
                            setModalAberto(true);
                          }}
                          title="Editar agendamento"
                          aria-label="Editar agendamento"
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white grid place-items-center"
                          onClick={() => handleExcluir(a.id)}
                          title="Excluir agendamento"
                          aria-label="Excluir agendamento"
                        >
                          <FaTrash />
                        </button>

                        {/* ✅ Texto, cor e ação agora obedecem *isEnviado* */}
                        <button
                          className={`col-span-2 h-9 rounded-lg text-white text-sm flex items-center justify-center gap-2 ${
                            isEnviado
                              ? "bg-gray-400 hover:bg-gray-500"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                          onClick={() => handleMarcarEnviado(a, isEnviado)}
                          title={
                            isEnviado
                              ? "Desfazer enviado (voltar para Pendente)"
                              : "Marcar como enviado"
                          }
                          aria-label={isEnviado ? "Desfazer enviado" : "Marcar como enviado"}
                        >
                          <FaCheckCircle />
                          {isEnviado ? "Desfazer enviado" : "Marcar enviado"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AgendamentoModal
        open={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setEditando(null);
        }}
        onSave={handleSalvar}
        agendamento={editando}
        contatos={contatos}
        templates={templates}
      />
    </div>
  );
}
