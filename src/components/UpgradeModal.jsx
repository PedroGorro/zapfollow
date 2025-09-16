// src/components/UpgradeModal.jsx
import { useState } from "react";
import { startProCheckout } from "../lib/payments"; // chama a Edge Function create-checkout
import { toast } from "react-hot-toast";

export default function UpgradeModal({
  open,
  onClose,
  plan,
  limits,
  usage,
  fromHeader = true, // se veio do Header, mostramos frase diferente
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // Detecta automaticamente se está no limite (para ajustar a copy)
  const finite = (n) => Number.isFinite(n);
  const atLimit =
    (finite(limits?.contatos) && (usage?.contatos ?? 0) >= limits.contatos) ||
    (finite(limits?.agendamentosMes) && (usage?.agendamentosMes ?? 0) >= limits.agendamentosMes) ||
    (finite(limits?.templates) && (usage?.templates ?? 0) >= limits.templates);

  const rows = [
    {
      label: "Contatos",
      used: usage?.contatos ?? 0,
      limit: finite(limits?.contatos) ? limits?.contatos : "Ilimitado",
      pro: "Ilimitado",
      help: "Cadastro de clientes/pacientes.",
    },
    {
      label: "Agendamentos (mês)",
      used: usage?.agendamentosMes ?? 0,
      limit: finite(limits?.agendamentosMes) ? limits?.agendamentosMes : "Ilimitado",
      pro: "Ilimitado",
      help: "Tarefas de follow-up criadas por mês.",
    },
    {
      label: "Templates",
      used: usage?.templates ?? 0,
      limit: finite(limits?.templates) ? limits?.templates : "Ilimitado",
      pro: "Ilimitado",
      help: "Mensagens salvas reutilizáveis.",
    },
  ];

  const showAspirational = fromHeader && !atLimit;

  async function handleUpgrade() {
    try {
      setLoading(true);
      await startProCheckout(); // abre o Mercado Pago; pode redirecionar direto
      // Se a função retornar controle (ex.: erro), caímos no catch abaixo
    } catch (e) {
      const msg = e?.message || "Erro ao abrir o checkout";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[61] w-full max-w-xl bg-white rounded-2xl shadow-lg p-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-extrabold text-gray-900">Faça upgrade para o Pro</h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Texto introdutório */}
        <p className="text-gray-600 mb-6">
          {showAspirational ? (
            <>
              Desbloqueie todo o potencial do <span className="font-semibold">ZapFollow</span> com o
              plano <span className="font-semibold">Pro</span>: recursos sem limites e suporte
              prioritário para crescer com segurança.
            </>
          ) : (
            <>
              Você atingiu os limites do plano <span className="font-semibold">Free</span>. O Pro
              libera contatos, agendamentos e templates <span className="font-semibold">ilimitados</span>,
              além de suporte prioritário.
            </>
          )}
        </p>

        {/* Comparativo Free x Pro */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-2">Recurso</th>
                <th className="text-right py-2">Seu uso</th>
                <th className="text-right py-2">Free</th>
                <th className="text-right py-2">Pro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t">
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{r.label}</div>
                    <div className="text-gray-500">{r.help}</div>
                  </td>
                  <td className="py-3 text-right font-medium">{r.used}</td>
                  <td className="py-3 text-right">{r.limit}</td>
                  <td className="py-3 text-right text-purple-600 font-semibold">{r.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Benefícios do Pro */}
        <div className="space-y-2 text-sm text-gray-700 mb-6">
          <div>✅ Contatos, agendamentos e templates <strong>ilimitados</strong></div>
          <div>✅ Biblioteca de mensagens profissionais</div>
          <div>✅ Suporte prioritário e atualizações exclusivas</div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm"
          >
            Agora não
          </button>
          <button
            onClick={async () => {
              onClose(); // mantém seu fluxo atual de fechar ao clicar
              await handleUpgrade(); // inicia checkout
            }}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium h-10 ${
              loading
                ? "bg-purple-400 cursor-wait"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Abrindo..." : "Quero o Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
