import { NavLink } from "react-router-dom";

const baseItem =
  "px-3 py-2 rounded-lg text-sm font-medium transition hover:bg-purple-50 hover:text-purple-700";
const activeItem =
  "bg-purple-100 text-purple-700 border border-purple-200";

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r min-h-full p-4">
      <div className="mb-4">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">Navegação</h2>
      </div>

      <nav className="flex flex-col gap-2 text-gray-700">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/contatos"
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
        >
          Contatos
        </NavLink>
        <NavLink
          to="/mensagens"
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
        >
          Mensagens
        </NavLink>
        <NavLink
          to="/agendamentos"
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
        >
          Agendamentos
        </NavLink>
      </nav>
    </aside>
  );
}
