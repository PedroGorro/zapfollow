// src/components/AgendamentoModal.jsx
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { STATUS_OPERACIONAL } from "../constants/status";

/* Helpers de data (sempre em horário local) */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function localDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function localTimeStr(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function AgendamentoModal({
  open,
  onClose,
  onSave,
  agendamento,
  contatos = [],
  templates = [],
}) {
  const [contatoId, setContatoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [templateId, setTemplateId] = useState("");
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [status, setStatus] = useState(STATUS_OPERACIONAL[0]); // "Pendente"
  const [incluirMensagem, setIncluirMensagem] = useState(true);
  const [erro, setErro] = useState("");

  const selectedContato = useMemo(
    () => contatos.find((c) => String(c.id) === String(contatoId)),
    [contatos, contatoId]
  );

  const categorias = useMemo(() => {
    const set = new Set(templates.map((t) => t.categoria || "Sem categoria"));
    return ["Todas", ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return templates
      .filter(
        (t) =>
          categoria === "Todas" || (t.categoria || "Sem categoria") === categoria
      )
      .filter(
        (t) =>
          !term ||
          (t.titulo || "").toLowerCase().includes(term) ||
          (t.corpo || "").toLowerCase().includes(term)
      );
  }, [templates, categoria, busca]);

  const selectedTemplate = useMemo(
    () =>
      filteredTemplates.find((t) => String(t.id) === String(templateId)) || null,
    [filteredTemplates, templateId]
  );

  const preview = useMemo(() => {
    const nome = selectedContato?.nome || "Cliente";
    return (mensagem || "").replace(/\{\{\s*nome\s*\}\}/gi, nome);
  }, [mensagem, selectedContato]);

  useEffect(() => {
    if (!open) return;

    if (agendamento) {
      setContatoId(String(agendamento.contatoId ?? agendamento.contato_id));

      const d = new Date(agendamento.quando);
      setData(localDateStr(d));
      setHora(localTimeStr(d));
      setMensagem(agendamento.mensagem || "");
      setStatus(agendamento.status || STATUS_OPERACIONAL[0]);

      const tmpl = templates.find(
        (t) =>
          String(t.id) ===
          String(agendamento.templateId ?? agendamento.template_id)
      );

      const cat = tmpl?.categoria || "Todas";
      setCategoria(cat);

      const idDentroDoFiltro =
        filteredTemplates.find((t) => String(t.id) === String(tmpl?.id))?.id ??
        filteredTemplates[0]?.id ??
        "";
      setTemplateId(idDentroDoFiltro);

      setIncluirMensagem(false);
    } else {
      setContatoId(contatos[0] ? String(contatos[0].id) : "");

      const now = new Date();
      setData(localDateStr(now));
      setHora(localTimeStr(now));

      setCategoria("Todas");

      const firstTemplate = templates[0] || null;
      setTemplateId(firstTemplate?.id ?? "");
      setMensagem(firstTemplate?.corpo ?? "Olá {{nome}}!");
      setStatus(STATUS_OPERACIONAL[0]);
      setIncluirMensagem(true);
    }

    setBusca("");
    setErro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const stillVisible = filteredTemplates.some(
      (t) => String(t.id) === String(templateId)
    );

    if (!stillVisible) {
      const novoId = filteredTemplates[0]?.id ?? "";
      setTemplateId(novoId);

      if (incluirMensagem) {
        const novoTemplate = filteredTemplates.find(
          (t) => String(t.id) === String(novoId)
        );
        if (novoTemplate?.corpo) setMensagem(novoTemplate.corpo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, filteredTemplates, open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedTemplate) return;
    if (incluirMensagem) setMensagem(selectedTemplate.corpo || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, open]);

  function handleToggleIncluirMensagem(checked) {
    setIncluirMensagem(checked);
    if (checked && selectedTemplate?.corpo) setMensagem(selectedTemplate.corpo);
  }

  async function handleSalvar() {
    if (!contatoId || !data || !hora || !mensagem.trim()) {
      setErro("Preencha contato, data, hora e mensagem.");
      return;
    }

    const quando = new Date(`${data}T${hora}:00`); // local

    // ✅ IMPORTANTE:
    // - contatoId agora é UUID (string) -> NÃO converter para Number.
    // - Incluo campos snake_case para compatibilidade com o DB novo (contato_id/template_id/created_at/updated_at).
    const payload = {
      ...(agendamento?.id ? { id: agendamento.id } : {}),

      // camelCase (seu app já usa)
      contatoId: String(contatoId),
      templateId: selectedTemplate ? String(selectedTemplate.id) : null,
      createdAt: agendamento?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // snake_case (DB)
      contato_id: String(contatoId),
      template_id: selectedTemplate ? String(selectedTemplate.id) : null,
      created_at: agendamento?.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),

      quando: quando.toISOString(),
      mensagem,
      status,
    };

    try {
      await toast.promise(Promise.resolve(onSave(payload)), {
        loading: agendamento ? "Atualizando agendamento..." : "Criando agendamento...",
        success: agendamento ? "Agendamento atualizado!" : "Agendamento criado!",
        error: "Erro ao salvar agendamento.",
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {agendamento ? "Editar" : "Novo"} Agendamento
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-red-500"
            title="Fechar"
          >
            ×
          </button>
        </div>

        <div className="grid gap-4 p-5">
          {erro && <div className="text-sm text-red-600">{erro}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contato
              </label>
              <select
                value={contatoId}
                onChange={(e) => setContatoId(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {contatos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template{" "}
                <span className="text-gray-500">(filtrado pela categoria)</span>
              </label>

              <div className="flex gap-2">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {filteredTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.categoria ? `${t.categoria} — ` : ""}
                      {t.titulo}
                    </option>
                  ))}
                </select>

                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar template..."
                  className="w-48 rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={incluirMensagem}
                  onChange={(e) =>
                    handleToggleIncluirMensagem(e.target.checked)
                  }
                />
                <span className="select-none">
                  Atualizar mensagem ao trocar template
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mensagem{" "}
              <span className="text-gray-500">
                (use{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
                  {"{{nome}}"}
                </code>
                )
              </span>
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Escreva sua mensagem ou selecione um template"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status (operacional)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {STATUS_OPERACIONAL.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 rounded-xl bg-gray-50 p-3">
              <div className="mb-1 text-xs text-gray-500">Pré-visualização</div>
              <div className="whitespace-pre-wrap">{preview}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button
            onClick={onClose}
            className="rounded-xl bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="rounded-xl bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
