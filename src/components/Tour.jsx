import { Fragment } from "react";

export default function Tour({ open, onClose }) {
  if (!open) return null;

  const steps = [
    {
      title: "1) Crie um contato",
      body:
        "Vá em Contatos → “+ Novo contato”. Adicione nome e telefone (com +55).",
    },
    {
      title: "2) Agende um follow‑up",
      body:
        "Em Agendamentos → “+ Novo agendamento”. Escolha o contato, defina data/hora e selecione/edite o template.",
    },
    {
      title: "3) Envie pelo WhatsApp",
      body:
        "Na lista de agendamentos, use o atalho do WhatsApp. Depois marque como enviado. Pronto! 🎉",
    },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Como usar (2 min)</h2>

          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                <div className="mt-1 text-sm text-gray-600">{s.body}</div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Fechar
            </button>
            <a
              href="/agendamentos"
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700"
            >
              Ir para agendamentos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
