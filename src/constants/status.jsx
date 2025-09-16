// Status COMERCIAIS (para CONTATOS)
export const STATUS_COMERCIAL = [
  "Novo",
  "Primeiro contato feito",
  "Em negociação",
  "Cliente",
  "Inativo",
];

// Status OPERACIONAIS (para AGENDAMENTOS/MENSAGENS)
export const STATUS_OPERACIONAL = [
  "Pendente",
  "Enviado – Sem resposta",
  "Respondido – Em andamento",
  "Finalizado",
  "Não houve retorno",
  "Cancelado",
  // "Atrasado" é derivado quando Pendente e passou do horário.
];

// Tudo que NÃO é "Pendente" conta como "já enviado"
export const ENVIADO_STATES = [
  "Enviado – Sem resposta",
  "Respondido – Em andamento",
  "Finalizado",
  "Não houve retorno",
  "Cancelado",
];

// Cores dos badges (contatos)
export const STATUS_COMERCIAL_COLORS = {
  "Novo": "bg-blue-100 text-blue-700",
  "Primeiro contato feito": "bg-indigo-100 text-indigo-700",
  "Em negociação": "bg-amber-100 text-amber-800",
  "Cliente": "bg-emerald-100 text-emerald-700",
  "Inativo": "bg-gray-200 text-gray-700",
};

// Cores dos badges (agendamentos)
export const STATUS_OPERACIONAL_COLORS = {
  "Pendente": "bg-yellow-100 text-yellow-800",
  "Enviado – Sem resposta": "bg-blue-100 text-blue-700",
  "Respondido – Em andamento": "bg-amber-100 text-amber-800",
  "Finalizado": "bg-green-100 text-green-700",
  "Não houve retorno": "bg-red-100 text-red-700",
  "Cancelado": "bg-red-100 text-red-700",
};
