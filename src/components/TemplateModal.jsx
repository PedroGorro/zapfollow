import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CATEGORIAS = ["Geral", "Orçamento", "Lembrete", "Agradecimento", "Reengajamento"];

export default function TemplateModal({ open, onClose, onSave, template }) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [corpo, setCorpo] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) return;
    if (template) {
      setTitulo(template.titulo || "");
      setCategoria(template.categoria || CATEGORIAS[0]);
      setCorpo(template.corpo || "");
    } else {
      setTitulo("");
      setCategoria(CATEGORIAS[0]);
      setCorpo("Olá {{nome}}, tudo bem? 🙂");
    }
    setErro("");
  }, [open, template]);

  if (!open) return null;

  async function handleSalvar() {
    if (!titulo.trim() || !corpo.trim()) {
      setErro("Título e Corpo da mensagem são obrigatórios.");
      return;
    }
    const payload = {
      ...(template?.id ? { id: template.id } : {}),
      titulo: titulo.trim(),
      categoria,
      corpo,
    };

    try {
      await toast.promise(
        Promise.resolve(onSave(payload)),
        {
          loading: template ? "Atualizando template..." : "Criando template...",
          success: template ? "Template atualizado com sucesso!" : "Template criado com sucesso!",
          error: "Erro ao salvar template.",
        }
      );
      onClose();
    } catch (err) {
      // o toast de erro acima já cobre
      // manter console para debug se necessário
      console.error(err);
    }
  }

  const preview = (corpo || "").replaceAll("{{nome}}", "Cliente");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {template ? "Editar" : "Novo"} Template
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl"
            title="Fechar"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="p-5 grid gap-4">
          {erro && <div className="text-red-600 text-sm">{erro}</div>}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Ex.: Retorno de orçamento"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Corpo da mensagem{" "}
              <span className="text-gray-500">
                (use <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{'{{nome}}'}</code>)
              </span>
            </label>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={6}
              className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Ex.: Olá {{nome}}, tudo bem? Vi que conversamos sobre o orçamento..."
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Pré-visualização</div>
            <div className="whitespace-pre-wrap">{preview}</div>
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
