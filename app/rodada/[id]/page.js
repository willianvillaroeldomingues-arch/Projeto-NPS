"use client";
 
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthGuard } from "../../../lib/useAuthGuard";
 
function montarMensagem(primeiroNome, link) {
  return `Olá, ${primeiroNome}! Tudo bem?
 
Passando para pedir só um minutinho do seu tempo para preencher a nossa pesquisa de satisfação.
 
A sua opinião é muito importante para nós, porque é através dela que conseguimos entender melhor a sua experiência, identificar pontos em que podemos melhorar e continuar oferecendo um atendimento cada vez mais próximo, cuidadoso e de excelência.
Se puder responder, vai nos ajudar muito!
 
🔗 Pesquisa de satisfação: ${link}
 
Muito obrigado por fazer parte da nossa jornada e por contribuir para que possamos evoluir sempre!`;
}
 
export default function VerRodadaPage() {
  const pronto = useAuthGuard();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [links, setLinks] = useState([]);
  const [carregando, setCarregando] = useState(true);
 
  useEffect(() => {
    if (!pronto || !id) return;
    async function carregar() {
      const { data: sv } = await supabase.from("nps_surveys").select("*").eq("id", id).single();
      const { data: fl } = await supabase
        .from("nps_form_links")
        .select("token, respondido, client_id")
        .eq("survey_id", id);
 
      setSurvey(sv);
 
      const clientIds = (fl || []).map((l) => l.client_id);
      let clientesPorId = {};
      if (clientIds.length > 0) {
        const { data: cls } = await supabase.from("clients").select("id, nome").in("id", clientIds);
        clientesPorId = Object.fromEntries((cls || []).map((c) => [c.id, c.nome]));
      }
 
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const resultado = (fl || [])
        .map((l) => ({
          nome: clientesPorId[l.client_id] || "—",
          respondido: l.respondido,
          url: `${base}/responder/${l.token}`,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      setLinks(resultado);
      setCarregando(false);
    }
    carregar();
  }, [pronto, id]);
 
  if (!pronto) return null;
  if (carregando) return <div className="container">Carregando...</div>;
  if (!survey)
    return (
      <div className="container">
        <p>Rodada não encontrada, ou você não tem permissão para vê-la.</p>
        <Link href="/">← Voltar ao painel</Link>
      </div>
    );
 
  function baixarCSV() {
    const linhas = [
      ["cliente", "respondido", "link", "mensagem"],
      ...links.map((l) => {
        const primeiroNome = (l.nome || "").trim().split(" ")[0];
        return [l.nome, l.respondido ? "sim" : "não", l.url, montarMensagem(primeiroNome, l.url)];
      }),
    ];
    const conteudo = linhas
      .map((linha) => linha.map((campo) => `"${(campo || "").toString().replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
 
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `links_${survey.titulo.replace(/[^\w]+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
 
  const respondidos = links.filter((l) => l.respondido).length;
 
  return (
    <div>
      <div className="top-bar">
        <Link href="/" style={{ color: "#f2e9d8", fontSize: 13, textDecoration: "none", opacity: 0.8 }}>
          ← Voltar
        </Link>
        <div className="eyebrow" style={{ marginTop: 10 }}>
          Links da rodada
        </div>
        <div className="title">{survey.titulo}</div>
      </div>
 
      <div className="container">
        <div
          className="card"
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 14 }}>
            {respondidos} de {links.length} clientes já responderam.
          </p>
          <button
            onClick={baixarCSV}
            style={{
              padding: "10px 18px",
              background: "var(--gold)",
              color: "#16324f",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ⬇ Baixar lista (CSV)
          </button>
        </div>
 
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Respondeu?</th>
                <th>Link do formulário</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={i}>
                  <td>{l.nome}</td>
                  <td>
                    <span className={l.respondido ? "badge badge-promotor" : "badge"}>
                      {l.respondido ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, wordBreak: "break-all" }}>{l.url}</td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--ink-soft)" }}>
                    Nenhum link gerado para essa rodada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
 
}
