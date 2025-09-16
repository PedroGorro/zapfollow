import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/AppStore";
import { useAuth } from "../state/AuthProvider";
import toast from "react-hot-toast";

/**
 * Banner de onboarding (checklist) que aparece no topo do Dashboard.
 * Some quando:
 *  - usuário completa os 3 passos; ou
 *  - usuário clica "Não mostrar novamente".
 */
export default function OnboardingBar({ onOpenTour }) {
  const { contatos, agendamentos, templates, importDefaultTemplates, reloadTemplates } = useAppStore();
  const { user } = useAuth();

  const storageKey = user ? `zapfollow.onboarding.dismissed:${user.id}` : null;
  const [dismissed, setDismissed] = useState(() => (storageKey ? localStorage.getItem(storageKey) === "1" : false));

  useEffect(() => {
    if (!user) return;
    const v = localStorage.getItem(storageKey);
    setDismissed(v === "1");
  }, [user?.id]);

  const steps = useMemo(() => {
      const hasContato = contatos.length > 0;
      const hasTemplate = templates.length > 0;
      const hasAgendamento = agendamentos.length > 0;
    // Consideramos "enviar via WhatsApp" quando houver qualquer agendamento com status != "Pendente"
    const sentWhats = agendamentos.some((a) => a.status && a.status !== "Pendente");

    return [
      { id: 1, label: "Criar 1 contato", done: hasContato },
    { id:2, label: "Criar 1 mensagem/template", done: hasTemplate },
      { id: 3, label: "Criar 1 agendamento", done: hasAgendamento },
      { id: 4, label: "Enviar WhatsApp via atalho", done: sentWhats },
    ];
  }, [contatos, agendamentos]);

  const allDone = steps.every((s) => s.done);

  useEffect(() => {
    if (allDone && !dismissed && storageKey) {
      toast.success("Pronto! Você já está convertendo mais 🎉");
      localStorage.setItem(storageKey, "1");
      setDismissed(true);
    }
  }, [allDone, dismissed, storageKey]);

  if (!user || dismissed) return null;

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-900">Comece em 3 passos</div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span
                  className={
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border " +
                    (s.done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400")
                  }
                >
                  {s.done ? "✓" : "○"}
                </span>
                <span className={s.done ? "text-gray-600 line-through" : "text-gray-700"}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {templates.length === 0 && (
            <button
              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
              onClick={async () => {
                try {
                  await importDefaultTemplates();
                  await reloadTemplates?.();
                  toast.success("Templates iniciais importados!");
                } catch (e) {
                  toast.error("Falha ao importar templates.");
                }
              }}
            >
              Importar templates iniciais
            </button>
          )}

          <button
            className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700"
            onClick={onOpenTour}
          >
            Como usar (2 min)
          </button>

          <button
            className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              if (!storageKey) return;
              localStorage.setItem(storageKey, "1");
              setDismissed(true);
            }}
          >
            Não mostrar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
