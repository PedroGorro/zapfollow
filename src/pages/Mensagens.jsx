import { useMemo, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaCopy, FaExternalLinkAlt, FaSearch, FaFilter, FaDownload } from "react-icons/fa";
import TemplateModal from "../components/TemplateModal";
import { useAppStore } from "../state/AppStore";
import toast from "react-hot-toast";

const CATEGORIAS = ["Todos", "Geral", "Orçamento", "Lembrete", "Agradecimento", "Reengajamento"];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function abrirWhatsAppSemNumero(mensagem) {
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

export default function Mensagens() {
  const {
    templates = [],
    tplLoading,
    tplError,
    saveTemplate,
    removeTemplate,
    importDefaultTemplates,
  } = useAppStore();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const filtrados = useMemo(() => {
    const term = normalize(busca.trim());
    return (templates || []).filter((t) => {
      const matchBusca =
        term === "" ||
        normalize(t.titulo || "").includes(term) ||
        normalize(t.corpo || "").includes(term);
      const matchCat = categoria === "Todos" || t.categoria === categoria;
      return matchBusca && matchCat;
    });
  }, [templates, busca, categoria]);

  // salvar (criar/editar) – toast será disparado dentro do TemplateModal
  async function handleSalvarTemplate(tNovo) {
    await saveTemplate(tNovo);
    setModalAberto(false);
    setEditando(null);
  }

  // excluir com toast
  async function handleExcluir(id) {
    if (!window.confirm("Deseja realmente excluir este template?")) return;
    try {
      await toast.promise(
        removeTemplate(id),
        {
          loading: "Excluindo template...",
          success: "Template excluído.",
          error: "Erro ao excluir template.",
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  function handleCopiar(texto) {
    navigator.clipboard.writeText(texto || "");
    toast.success("Mensagem copiada.");
  }

  const isEmpty = !tplLoading && !tplError && (templates?.length || 0) === 0;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mensagens</h2>
          <p className="text-sm text-gray-500">Templates reutilizáveis com placeholders.</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAberto(true); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700 flex items-center gap-2"
        >
          <FaPlus /> Novo Template
        </button>
      </div>

      {/* Barra de busca/filtro (oculta quando vazio para destacar o CTA) */}
      {!isEmpty && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3 top-2.5 text-gray-400"><FaSearch /></span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou conteúdo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Estados de carregamento/erro */}
      {tplLoading && <div className="text-gray-500">Carregando templates...</div>}
      {!tplLoading && tplError && <div className="text-red-600">Erro: {tplError}</div>}

      {/* Estado vazio elegante + CTA de import */}
      {!tplLoading && !tplError && isEmpty && (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 grid place-items-center mb-3">
            <FaDownload />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Comece com templates prontos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Importe 5 mensagens de alta conversão (um por categoria) e personalize depois.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              onClick={importDefaultTemplates}
            >
              Importar templates iniciais
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
              onClick={() => { setEditando(null); setModalAberto(true); }}
            >
              Criar do zero
            </button>
          </div>
        </div>
      )}

      {/* Grid de templates */}
      {!tplLoading && !tplError && !isEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.length === 0 ? (
            <div className="text-gray-500">Nenhum template encontrado.</div>
          ) : (
            filtrados.map((t) => {
              const preview =
                (t.corpo || "").length > 160 ? (t.corpo || "").slice(0, 160) + "..." : (t.corpo || "");
              return (
                <div key={t.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded-lg">
                        {t.categoria}
                      </div>
                      <h3 className="text-lg font-semibold mt-1 text-gray-900">{t.titulo}</h3>
                    </div>
                    <div className="text-xs text-gray-400">
                      {t.updated_at ? new Date(t.updated_at).toLocaleDateString("pt-BR") : "-"}
                    </div>
                  </div>

                  <div className="text-gray-700 whitespace-pre-wrap">{preview}</div>

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2"
                      onClick={() => handleCopiar(t.corpo)}
                      title="Copiar mensagem"
                      aria-label="Copiar mensagem"
                    >
                      <FaCopy /> Copiar
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-2"
                      onClick={() => abrirWhatsAppSemNumero((t.corpo || "").replaceAll("{{nome}}", "Cliente"))}
                      title="Abrir WhatsApp com a mensagem"
                      aria-label="Abrir WhatsApp"
                    >
                      <FaExternalLinkAlt /> WhatsApp
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2"
                      onClick={() => { setEditando(t); setModalAberto(true); }}
                      title="Editar template"
                      aria-label="Editar template"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                      onClick={() => handleExcluir(t.id)}
                      title="Excluir template"
                      aria-label="Excluir template"
                    >
                      <FaTrash /> Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <TemplateModal
        open={modalAberto}
        onClose={() => { setModalAberto(false); setEditando(null); }}
        onSave={handleSalvarTemplate}
        template={editando}
      />
    </div>
  );
}
