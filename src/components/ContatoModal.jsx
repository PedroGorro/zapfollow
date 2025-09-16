import { useEffect, useState } from "react";
import { STATUS_COMERCIAL } from "../constants/status";
// no topo do ContatoModal.jsx
import toast from "react-hot-toast";


function onlyDigits(s = "") {
  return String(s).replace(/\D/g, "");
}

// Formata para: +55 DD 9XXXX-XXXX (ou fixo DD XXXX-XXXX)
function formatBrazilPhone(raw) {
  let digits = onlyDigits(raw);
  if (digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);

  let middle = "";
  if (local.length > 0) {
    if (local.length <= 5) middle = local;
    else middle = `${local.slice(0, local.length - 4)}-${local.slice(-4)}`;
  }
  return `+55${ddd ? " " + ddd : ""}${middle ? " " + middle : ""}`;
}

export default function ContatoModal({ open, onClose, onSave, contato }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("+55 ");
  const [status, setStatus] = useState(STATUS_COMERCIAL[0]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) return;
    if (contato) {
      setNome(contato.nome || "");
      setTelefone(formatBrazilPhone(contato.telefone || ""));
      setStatus(contato.status || STATUS_COMERCIAL[0]);
    } else {
      setNome("");
      setTelefone("+55 ");
      setStatus(STATUS_COMERCIAL[0]);
    }
    setErro("");
  }, [open, contato]);

  if (!open) return null;

  function validar() {
    if (!nome.trim()) return "Informe o nome.";
    let digits = onlyDigits(telefone);
    if (digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length < 10 || digits.length > 11) {
      return "Informe um telefone válido (DDD + número).";
    }
    return "";
  }

  async function handleSalvar() {
  const e = validar();
  if (e) {
    setErro(e);
    return;
  }

  try {
    // onSave deve retornar uma Promise (no seu caso retorna, pois vem do AppStore)
    await toast.promise(
      Promise.resolve(onSave({ nome: nome.trim(), telefone, status })),
      {
        loading: "Salvando contato...",
        success: "Contato salvo com sucesso!",
        error: "Erro ao salvar contato.",
      }
    );
    onClose(); // fecha o modal só se deu certo
  } catch (err) {
    // Se onSave lançar erro, o toast acima já mostra "Erro ao salvar contato."
    // Mantemos aqui caso queira debugar:
    console.error(err);
  }
}


  function handleTelefoneChange(e) {
    setTelefone(formatBrazilPhone(e.target.value));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {contato ? "Editar Contato" : "Novo Contato"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl"
            title="Fechar"
          >
            ×
          </button>
        </div>

        <div className="p-5 grid gap-4">
          {erro && <div className="text-red-600 text-sm">{erro}</div>}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Ex.: Maria Souza"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Telefone</label>
            <input
              value={telefone}
              onChange={handleTelefoneChange}
              className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="+55 11 91234-5678"
              inputMode="tel"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cole com ou sem máscara (DDD + número). O formato será normalizado para
              <span className="font-mono"> +55 DD 9XXXX-XXXX</span>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Status (comercial)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {STATUS_COMERCIAL.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
