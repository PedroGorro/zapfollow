import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { STATUS_COMERCIAL } from "../constants/status";

/* =======================
   Limites de plano (ajuste fácil)
   ======================= */
const FREE_LIMITS = {
  contatos: 50,
  agendamentosMes: 30, // Free por mês
  templates: 8,
};

const PRO_LIMITS = {
  contatos: Infinity,
  agendamentosMes: Infinity,
  templates: Infinity,
};

const AppStoreContext = createContext(null);

// ---- helpers de data ----
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeQuando(input) {
  if (!input) return null;
  if (typeof input === "string") {
    if (/Z$|[+-]\d\d:\d\d$/.test(input)) return input;
    const d = new Date(input);
    if (isNaN(d)) return null;
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  }
  if (input instanceof Date) {
    return new Date(input.getTime() - input.getTimezoneOffset() * 60000).toISOString();
  }
  return null;
}
function isInCurrentMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function AppStoreProvider({ children }) {
  const [userId, setUserId] = useState(null);

  const [contatos, setContatos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Plano e limites
  const [plan, setPlan] = useState("free"); // 'free' | 'pro'
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // -------- bootstrap: pega usuário e plano --------
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: u, error: eUser } = await supabase.auth.getUser();
        if (eUser) throw eUser;
        const uid = u?.user?.id || null;
        setUserId(uid);

        if (uid) {
          const { data: profile, error: eP } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", uid)
            .single();

          if (eP && eP.code !== "PGRST116") throw eP; // ignora 'no rows'

          if (!profile) {
            await supabase.from("profiles").upsert({ id: uid, plan: "free" });
            setPlan("free");
          } else {
            setPlan((profile.plan || "free").toLowerCase());
          }
        }
      } catch (err) {
        console.error("Falha no bootstrap:", err);
        alert("Erro ao carregar perfil. Veja o console.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -------- carrega dados do usuário (multi-tenant) --------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const { data: cts, error: e1 } = await supabase
          .from("contatos")
          .select("*")
          .eq("user_id", userId)
          .order("id", { ascending: false });
        if (e1) throw e1;
        setContatos(cts || []);

        const { data: tmps, error: e2 } = await supabase
          .from("templates")
          .select("*")
          .eq("user_id", userId)
          .order("id", { ascending: false });
        if (e2) throw e2;
        setTemplates(tmps || []);

        const { data: ags, error: e3 } = await supabase
          .from("agendamentos")
          .select("*")
          .eq("user_id", userId)
          .order("quando", { ascending: false });
        if (e3) throw e3;
        setAgendamentos(ags || []);
      } catch (err) {
        console.error("Falha ao carregar dados:", err);
        alert("Erro ao carregar dados do Supabase. Veja o console.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // limites efetivos de acordo com plano
  const limits = useMemo(() => (plan === "pro" ? PRO_LIMITS : FREE_LIMITS), [plan]);

  // Contadores de uso
  const usage = useMemo(() => {
    const agMes = agendamentos.filter((a) => isInCurrentMonth(a.created_at)).length;
    return {
      contatos: contatos.length,
      templates: templates.length,
      agendamentosMes: agMes,
    };
  }, [contatos, templates, agendamentos]);

  // 🔒 Bloqueio global (se QUALQUER limite estourado)
  function hasReachedLimit() {
    if (plan === "pro") return false;
    return (
      usage.contatos >= limits.contatos ||
      usage.templates >= limits.templates ||
      usage.agendamentosMes >= limits.agendamentosMes
    );
  }

  // Abre modal de upgrade e bloqueia ação
  function triggerUpgrade() {
    setUpgradeOpen(true);
    return false;
  }

  // Pode criar algo novo?
  function canCreate() {
    return plan === "pro" ? true : !hasReachedLimit() || triggerUpgrade();
  }

  // Pode editar agendamento?
  function canEditAgendamento() {
    // bloqueamos edição de agendamento quando há limite estourado
    return plan === "pro" ? true : !hasReachedLimit() || triggerUpgrade();
  }

  // -------- CONTATOS --------
  async function addContato(payload) {
    if (!canCreate() || !userId) return;

    const novo = {
      user_id: userId,
      nome: payload.nome,
      telefone: payload.telefone,
      status: payload.status || STATUS_COMERCIAL[0],
      ultima_acao: todayLocalISO(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("contatos").insert(novo).select().single();
    if (error) {
      console.error(error);
      alert("Erro ao criar contato");
      return;
    }
    setContatos((prev) => [data, ...prev]);
  }

  async function updateContato(contatoAtualizado) {
    if (!userId) return;
    // edição de contato continua permitida mesmo no Free com limite atingido
    const payload = {
      nome: contatoAtualizado.nome,
      telefone: contatoAtualizado.telefone,
      status: contatoAtualizado.status,
      ultima_acao: contatoAtualizado.ultima_acao || todayLocalISO(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("contatos")
      .update(payload)
      .eq("id", contatoAtualizado.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) {
      console.error(error);
      alert("Erro ao atualizar contato");
      return;
    }
    setContatos((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  }

  async function updateContatoStatus(contatoId, novoStatus) {
    if (!userId) return;
    // status também continua permitido
    const payload = {
      status: novoStatus,
      ultima_acao: todayLocalISO(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("contatos")
      .update(payload)
      .eq("id", contatoId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) {
      console.error(error);
      alert("Erro ao atualizar status do contato");
      return;
    }
    setContatos((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  }

  async function removeContato(id) {
    if (!userId) return;
    // excluir continua permitido (não “libera” o free)
    const { error } = await supabase.from("contatos").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      console.error(error);
      alert("Erro ao excluir contato");
      return;
    }
    setContatos((prev) => prev.filter((c) => c.id !== id));
    setAgendamentos((prev) => prev.filter((a) => a.contato_id !== id));
  }

  // -------- TEMPLATES --------
  async function saveTemplate(t) {
    if (!userId) return;
    if (t.id) {
      // edição de template continua permitida
      const payload = {
        titulo: t.titulo,
        categoria: t.categoria,
        corpo: t.corpo,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("templates")
        .update(payload)
        .eq("id", t.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) {
        console.error(error);
        alert("Erro ao atualizar template");
        return;
      }
      setTemplates((prev) => prev.map((x) => (x.id === data.id ? data : x)));
    } else {
      if (!canCreate()) return;

      const novo = {
        user_id: userId,
        titulo: t.titulo,
        categoria: t.categoria,
        corpo: t.corpo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("templates").insert(novo).select().single();
      if (error) {
        console.error(error);
        alert("Erro ao criar template");
        return;
      }
      setTemplates((prev) => [data, ...prev]);
    }
  }

  async function removeTemplate(id) {
    if (!userId) return;
    // excluir permitido
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error(error);
      alert("Erro ao excluir template");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  // Importação de templates iniciais (para o botão da tela)
  async function seedInitialTemplates() {
    if (!userId) return;
    // evita duplicar se já houver algo
    if (templates.length > 0) return;

    const base = [
      {
        titulo: "Primeiro contato",
        categoria: "Geral",
        corpo:
          "Olá {{nome}}, tudo bem? Vi seu interesse e queria entender como posso te ajudar hoje.",
      },
      {
        titulo: "Lembrete (véspera)",
        categoria: "Lembretes",
        corpo: "Olá {{nome}}! Passando para lembrar nossa conversa amanhã às {{hora}}. Tudo certo?",
      },
      {
        titulo: "Reengajamento",
        categoria: "Reengajamento",
        corpo: "Oi {{nome}}, faz um tempinho! Ainda faz sentido seguirmos com a proposta?",
      },
      {
        titulo: "Agradecimento",
        categoria: "Geral",
        corpo: "Obrigado, {{nome}}! Qualquer dúvida fico à disposição.",
      },
      {
        titulo: "Confirmação",
        categoria: "Lembretes",
        corpo: "Confirmado 🙌 Nos vemos em breve, {{nome}}.",
      },
    ].map((t) => ({
      ...t,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from("templates").insert(base).select();
    if (error) {
      console.error(error);
      alert("Erro ao importar templates iniciais");
      return;
    }
    setTemplates((prev) => [...(data || []), ...prev]);
  }
  // aliases para compat com componentes
  const importTemplatesIniciais = seedInitialTemplates;
  const importDefaultTemplates = seedInitialTemplates;

  // -------- AGENDAMENTOS --------
  async function saveAgendamento(a) {
    try {
      if (!userId) return;
      const quandoISO = normalizeQuando(a.quando);

      if (a.id) {
        // 🔒 edição de agendamento também bloqueada no limite
        if (!canEditAgendamento()) return;

        const payload = {
          contato_id: a.contatoId ?? a.contato_id,
          template_id: a.templateId ?? a.template_id ?? null,
          quando: quandoISO,
          mensagem: a.mensagem,
          status: a.status,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from("agendamentos")
          .update(payload)
          .eq("id", a.id)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) throw error;

        setAgendamentos((prev) => prev.map((x) => (x.id === data.id ? data : x)));
        return data;
      } else {
        if (!canCreate()) return;

        const novo = {
          user_id: userId,
          contato_id: a.contatoId ?? a.contato_id,
          template_id: a.templateId ?? a.template_id ?? null,
          quando: quandoISO,
          mensagem: a.mensagem,
          status: a.status || "Pendente",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from("agendamentos").insert(novo).select().single();
        if (error) throw error;

        setAgendamentos((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error("saveAgendamento", err);
      alert(err.message || "Erro ao salvar agendamento");
      throw err;
    }
  }

  async function removeAgendamento(id) {
    if (!userId) return;
    // excluir permitido
    const { error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error(error);
      alert("Erro ao excluir agendamento");
      return;
    }
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  }

  // "Marcar enviado" — compat com botão da tela
// troca o status (Enviado <-> Pendente) e mantém RLS por user_id
async function marcarEnviado(id, desfazer = false) {
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  const novoStatus = desfazer ? "Pendente" : "Enviado";

  const payload = {
    status: novoStatus,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("agendamentos")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId) // garante só do próprio usuário
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Erro ao atualizar agendamento");
    return;
  }

  setAgendamentos((prev) => prev.map((a) => (a.id === id ? data : a)));
}

  // alias para compatibilidade
 const marcarAgendamentoEnviado = marcarEnviado;

  // Helpers
  function getContatoById(id) {
    return contatos.find((c) => c.id === id);
  }
  function getTemplateById(id) {
    return templates.find((t) => t.id === id);
  }

  // KPIs simples (mantidos)
  const kpis = useMemo(() => {
    const hoje = todayLocalISO();
    const novosHoje = contatos.filter((c) => c.ultima_acao === hoje && c.status === "Novo").length;
    const statusDistrib = contatos.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    const taxaConversao =
      Math.round(
        (contatos.filter((c) => c.status === "Cliente").length / Math.max(contatos.length, 1)) *
          1000
      ) / 10;

    const now = new Date();
    const inicioHoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fimHoje = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let enviadasHoje = 0;
    for (const a of agendamentos) {
      if (a.status !== "Pendente") {
        const ref = new Date(a.updated_at || a.quando);
        if (ref >= inicioHoje && ref <= fimHoje) enviadasHoje++;
      }
    }

    return {
      novosHoje,
      agendamentosCount: agendamentos.length,
      taxaConversao,
      statusDistrib,
      mensagensEnviadas: agendamentos.filter((a) => a.status !== "Pendente").length,
      enviadasHoje,
    };
  }, [contatos, agendamentos]);

  const value = {
    loading,
    // state
    contatos,
    templates,
    agendamentos,
    kpis,

    // plano/limites
    plan,
    limits,
    usage,
    upgradeOpen,
    openUpgrade: () => setUpgradeOpen(true),
    closeUpgrade: () => setUpgradeOpen(false),

    // contatos
    addContato,
    updateContato,
    removeContato,
    updateContatoStatus,

    // templates
    saveTemplate,
    removeTemplate,
    seedInitialTemplates,
    importTemplatesIniciais,
    importDefaultTemplates,

    // agendamentos
    saveAgendamento,
    removeAgendamento,
    marcarEnviado,
    marcarAgendamentoEnviado,

    // util
    getContatoById,
    getTemplateById,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore precisa estar dentro de <AppStoreProvider>");
  return ctx;
}
