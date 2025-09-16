// src/components/EmptyState.jsx
import { FaInbox } from "react-icons/fa";

export default function EmptyState({
  icon = <FaInbox />,
  title = "Nada por aqui ainda",
  description = "Assim que você criar seus primeiros itens, eles aparecerão aqui.",
  primaryAction, // { label, onClick, to, variant }
  secondaryAction, // { label, onClick, to, variant }
  className = "",
}) {
  const Btn = ({ action }) => {
    if (!action) return null;
    const base =
      "px-4 py-2 rounded-xl shadow-sm transition text-sm font-medium";
    const variants = {
      primary: "bg-purple-600 text-white hover:bg-purple-700",
      outline: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
      ghost: "bg-transparent hover:bg-gray-50 text-gray-700",
    };
    const cls = `${base} ${variants[action.variant || "primary"]}`;

    if (action.to) {
      // Link simples sem dependência: usa <a> mesmo (rotas internas ok)
      return (
        <a href={action.to} className={cls} aria-label={action.label}>
          {action.label}
        </a>
      );
    }
    return (
      <button onClick={action.onClick} className={cls} aria-label={action.label}>
        {action.label}
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md p-10 text-center ${className}`}>
      <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 grid place-items-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Btn action={primaryAction} />
        <Btn action={secondaryAction} />
      </div>
    </div>
  );
}
