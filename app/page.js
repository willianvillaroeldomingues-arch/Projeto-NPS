"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useAuthGuard } from "../lib/useAuthGuard";
 
function Categoria({ score }) {
  if (score === null || score === undefined) return "—";
  return score;
}
 
export default function DashboardPage() {
  const pronto = useAuthGuard();
  const [rodadas, setRodadas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [apagando, setApagando] = useState(null); // id do item sendo apagado (mostra "Apagando...")
 
  async function carregar() {
    const [{ data: rd }, { data: cl }] = await Promise.all([
      supabase.from("nps_por_survey").select("*").order("mes_referencia"),
      supabase.from("nps_medio_por_cliente").select("*").order("nome"),
    ]);
    setRodadas(rd || []);
    setClientes(cl || []);
    setCarregando(false);
  }
 
  useEffect(() => {
    if (!pronto) return;
    carregar();
  }, [pronto]);
 
  if (!pronto) return null;
 
  const ultimaRodada = rodadas[rodadas.length - 1];
  const npsGeral =
    rodadas.length > 0
      ? Math.round(rodadas.reduce((acc, e) => acc + (e.nps_score || 0), 0) / rodadas.length)
      : null;
 
  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
 
  async function apagarRodada(rodada) {
    const confirmado = window.confirm(
      `Apagar a rodada "${rodada.titulo}"?\n\nIsso vai apagar também as ${rodada.total_respostas} resposta(s) recebida(s) nela. Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;
 
    setApagando(rodada.survey_id);
    const { error } = await supabase.from("nps_surveys").delete().eq("id", rodada.survey_id);
    setApagando(null);
 
    if (error) {
      alert("Não foi possível apagar a rodada. Tente novamente.");
      return;
    }
    carregar();
  }
 
  async function apagarCliente(cliente) {
    const confirmado = window.confirm(
      `Apagar o cliente "${cliente.nome}"?\n\nIsso vai apagar também todo o histórico de respostas dele (${cliente.total_respostas} resposta(s)). Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;
 
    setApagando(cliente.client_id);
    const { error } = await supabase.from("clients").delete().eq("id", cliente.client_id);
    setApagando(null);
 
    if (error) {
      alert("Não foi possível apagar o cliente. Tente novamente.");
      return;
    }
    carregar();
  }
 
  return (
    <div>
      <div
        className="top-bar"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <div className="eyebrow">Painel de NPS</div>
          <div className="title">Visão geral</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/nova-rodada"
            style={{
              background: "var(--gold)",
              color: "#16324f",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + Nova rodada
          </Link>
          <button
            onClick={sair}
            style={{
              background: "none",
              border: "1px solid rgba(242,233,216,0.4)",
              color: "#f2e9d8",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Sair
          </button>
        </div>
      </div>
 
      <div className="container">
        {carregando ? (
          <p>Carregando...</p>
        ) : (
          <>
            <div className="grid grid-3" style={{ marginBottom: 28 }}>
              <div className="card">
                <div className="stat-label">NPS médio geral</div>
                <div className="stat">
                  <Categoria score={npsGeral} />
                </div>
              </div>
              <div className="card">
                <div className="stat-label">Última rodada</div>
                <div className="stat">
                  <Categoria score={ultimaRodada?.nps_score} />
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                  {ultimaRodada?.titulo || "Nenhuma rodada ainda"}
                </div>
              </div>
              <div className="card">
                <div className="stat-label">Clientes cadastrados</div>
                <div className="stat">{clientes.length}</div>
              </div>
            </div>
 
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>
              Evolução do NPS por rodada
            </h2>
            <div className="card" style={{ marginBottom: 28 }}>
              <table>
                <thead>
                  <tr>
                    <th>Rodada</th>
                    <th>Mês</th>
                    <th>Respostas</th>
                    <th>NPS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rodadas.map((r) => (
                    <tr key={r.survey_id}>
                      <td>
                        <Link className="link-row" href={`/rodada/${r.survey_id}`}>
                          {r.titulo}
                        </Link>
                      </td>
                      <td>
                        {new Date(r.mes_referencia + "T12:00:00").toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td>{r.total_respostas}</td>
                      <td>{r.nps_score ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => apagarRodada(r)}
                          disabled={apagando === r.survey_id}
                          style={{
                            background: "none",
                            border: "1px solid var(--error)",
                            color: "var(--error)",
                            fontSize: 12,
                            padding: "4px 10px",
                            cursor: "pointer",
                            opacity: apagando === r.survey_id ? 0.5 : 1,
                          }}
                        >
                          {apagando === r.survey_id ? "Apagando..." : "Apagar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rodadas.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--ink-soft)" }}>
                        Nenhuma rodada de NPS enviada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
 
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>
              Clientes
            </h2>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Empresa</th>
                    <th>Respostas</th>
                    <th>Nota média</th>
                    <th>NPS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.client_id}>
                      <td>
                        <Link className="link-row" href={`/clientes/${c.client_id}`}>
                          {c.nome}
                        </Link>
                      </td>
                      <td>{c.empresa || "—"}</td>
                      <td>{c.total_respostas}</td>
                      <td>{c.nota_media ?? "—"}</td>
                      <td>{c.nps_score_medio ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => apagarCliente(c)}
                          disabled={apagando === c.client_id}
                          style={{
                            background: "none",
                            border: "1px solid var(--error)",
                            color: "var(--error)",
                            fontSize: 12,
                            padding: "4px 10px",
                            cursor: "pointer",
                            opacity: apagando === c.client_id ? 0.5 : 1,
                          }}
                        >
                          {apagando === c.client_id ? "Apagando..." : "Apagar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clientes.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ color: "var(--ink-soft)" }}>
                        Nenhum cliente cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
 
