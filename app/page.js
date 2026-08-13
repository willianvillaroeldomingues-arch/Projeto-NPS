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
  const [evolucao, setEvolucao] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!pronto) return;
    async function carregar() {
      const [{ data: ev }, { data: cl }] = await Promise.all([
        supabase.from("nps_geral_evolucao").select("*"),
        supabase.from("nps_medio_por_cliente").select("*").order("nome"),
      ]);
      setEvolucao(ev || []);
      setClientes(cl || []);
      setCarregando(false);
    }
    carregar();
  }, [pronto]);

  if (!pronto) return null;

  const ultimaRodada = evolucao[evolucao.length - 1];
  const npsGeral =
    evolucao.length > 0
      ? Math.round(
          evolucao.reduce((acc, e) => acc + (e.nps_score || 0), 0) / evolucao.length
        )
      : null;

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div>
      <div className="top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                <div className="stat"><Categoria score={npsGeral} /></div>
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
                  </tr>
                </thead>
                <tbody>
                  {evolucao.map((e) => (
                    <tr key={e.titulo + e.mes_referencia}>
                      <td>{e.titulo}</td>
                      <td>{new Date(e.mes_referencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                      <td>{e.total_respostas}</td>
                      <td>{e.nps_score ?? "—"}</td>
                    </tr>
                  ))}
                  {evolucao.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--ink-soft)" }}>
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
                    </tr>
                  ))}
                  {clientes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--ink-soft)" }}>
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
