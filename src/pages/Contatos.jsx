import { useMemo, useState } from "react";
import { FaWhatsapp, FaEdit, FaTrash } from "react-icons/fa";
import ContatoModal from "../components/ContatoModal";
import { useAppStore } from "../state/AppStore";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState";

/** Chips de status com a mesma paleta do resto do app */
const statusColors = {
  "Novo": "bg-blue-100 text-blue-700",
  "Primeiro contato feito": "bg-purple-100 text-purple-700",
  "Em negociação": "bg-yellow-100 text-yellow-800",
  "Cliente": "bg-emerald-100 text-emerald-600",
  "Inativo": "bg-gray-100 text-gray-700",
  "Perdido": "bg-red-100 text-red-600",
};

const statusOptions = ["Todos", "Novo", "Primeiro contato feito", "Em negociação", "Cliente", "Inativo", "Perdido"];

// normaliza acentos e caixa
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function abrirWhatsApp(telefone) {
  const link = `https://wa.me/${(telefone || "").replace(/\D/g, "")}`;
  window.open(link, "_blank");
}

function formatDateBR(d) {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(`${d}T00:00:00`) : new Date(d);
  return dt.toLocaleDateString("pt-BR");
}

export default function Contatos() {
  const {
    contatos,
    addContato, updateContato, removeContato,
  } = useAppStore();

  const [modalAberto, setModalAberto] = useState(false);
  const [contatoEditando, setContatoEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  // IMPORTANTE: apenas retorna a Promise para o modal usar toast.promise e fechar por lá
  function handleSalvarContato(payload) {
    if (contatoEditando) {
      return updateContato({ ...contatoEditando, ...payload })
        .then(() => toast.success("Contato atualizado com sucesso!"))
        .catch(() => { throw new Error("Erro ao atualizar contato."); })
        .finally(() => {
          setContatoEditando(null);
          setModalAberto(false);
        });
    } else {
      return addContato(payload)
        .then(() => toast.success("Contato criado com sucesso!"))
        .catch(() => { throw new Error("Erro ao criar contato."); })
        .finally(() => {
          setContatoEditando(null);
          setModalAberto(false);
        });
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Excluir este contato? Todos os agendamentos associados a ele também serão excluídos.")) {
      return;
    }
    try {
      await toast.promise(
        removeContato(id),
        {
          loading: "Excluindo contato...",
          success: "Contato excluído.",
          error: "Erro ao excluir contato.",
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  const contatosFiltrados = useMemo(() => {
    const term = normalize(busca.trim());
    const numBusca = busca.replace(/\D/g, "");
    return (contatos || []).filter((c) => {
      const matchNome = normalize(c.nome).includes(term);
      const matchTel = (c.telefone || "").replace(/\D/g, "").includes(numBusca);
      const matchStatus = statusFiltro === "Todos" || c.status === statusFiltro;
      return (term === "" || matchNome || (numBusca && matchTel)) && matchStatus;
    });
  }, [contatos, busca, statusFiltro]);

  const isEmpty = (contatosFiltrados.length === 0);

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contatos</h2>
          <p className="text-sm text-gray-500">Base de clientes e prospects.</p>
        </div>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700 transition"
          onClick={() => { setContatoEditando(null); setModalAberto(true); }}
        >
          + Novo Contato
        </button>
      </div>

      {/* Busca / Filtro */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[240px] border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <select
          className="rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white shadow-md rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Telefone</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Última Ação</th>
              <th className="px-4 py-3 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    title={busca || statusFiltro !== "Todos" ? "Nenhum contato encontrado" : "Você ainda não tem contatos"}
                    description={busca || statusFiltro !== "Todos"
                      ? "Ajuste os filtros ou limpe a busca para ver todos os contatos."
                      : "Adicione seu primeiro contato e comece a fazer follow‑ups."}
                    primaryAction={{ label: "+ Novo contato", onClick: () => { setContatoEditando(null); setModalAberto(true); } }}
                   
                    className="rounded-none shadow-none"
                  />
                </td>
              </tr>
            ) : (
              contatosFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition border-b last:border-b-0">
                  <td className="px-4 py-3">{c.nome}</td>
                  <td className="px-4 py-3">{c.telefone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[c.status] || "bg-gray-100 text-gray-700"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatDateBR(c.ultimaAcao || c.ultima_acao)}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-center gap-3">
                    <button
                      title="WhatsApp"
                      aria-label="Abrir WhatsApp"
                      className="h-9 w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white grid place-items-center"
                      onClick={() => abrirWhatsApp(c.telefone)}
                    >
                      <FaWhatsapp />
                    </button>
                    <button
                      title="Editar"
                      aria-label="Editar contato"
                      className="h-9 w-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white grid place-items-center"
                      onClick={() => { setContatoEditando(c); setModalAberto(true); }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      title="Excluir"
                      aria-label="Excluir contato"
                      className="h-9 w-9 rounded-lg bg-red-600 hover:bg-red-700 text-white grid place-items-center"
                      onClick={() => handleExcluir(c.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ContatoModal
        open={modalAberto}
        onClose={() => { setModalAberto(false); setContatoEditando(null); }}
        onSave={handleSalvarContato}
        contato={contatoEditando}
      />
    </div>
  );
}
