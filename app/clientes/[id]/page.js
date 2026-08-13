"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthGuard } from "../../../lib/useAuthGuard";

function badgeClass(categoria) {
  if (categoria === "promotor") return "badge badge-promotor";
  if (categoria === "neutro") return "badge badge-neutro";
  if (categoria === "detrator") return "badge badge-detrator";
  return "badge";
}

export default function PastaClientePage() {
  const pronto = useAuthGuard();
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!pronto || !id) return;
    async function carregar() {
      const [{ data: cl }, { data: resp }] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("nps_respostas_detalhado")
          .select("*")
          .eq("client_id", id)
          .order("respondido_em", { ascending: false }),
      ]);
      setCliente(cl);
      setRespostas(resp || []);
      setCarregando(false);
    }
    carregar();
  }, [pronto, id]);

  if (!pronto) return null;
  if (carregando) return <div className="container">Carregando...</div>;
  if (!cliente) return <div className="container">Cliente não encontrado.</div>;

  // Agrupa as respostas por rodada (survey)
  const porRodada = {};
  for (const r of respostas) {
    if (!porRodada[r.response_id]) {
      porRodada[r.response_id] = {
        survey_titulo: r.survey_titulo,
        respondente_nome: r.respondente_nome,
        respondido_em: r.respondido_em,
        itens: [],
      };
    }
    porRodada[r.response_id].itens.push(r);
  }
  const rodadas = Object.values(porRodada).sort(
    (a, b) => new Date(b.respondido_em) - new Date(a.respondido_em)
  );

  return (
    <div>
      <div className="top-bar">
        <Link href="/" style={{ color: "#f2e9d8", fontSize: 13, textDecoration: "none", opacity: 0.8 }}>
          ← Voltar
        </Link>
        <div className="eyebrow" style={{ marginTop: 10 }}>
          Pasta do cliente
        </div>
        <div className="title">{cliente.nome}</div>
      </div>

      <div className="container">
        <div className="grid grid-3" style={{ marginBottom: 28 }}>
          <div className="card">
            <div className="stat-label">Empresa</div>
            <div style={{ fontSize: 16 }}>{cliente.empresa || "—"}</div>
          </div>
          <div className="card">
            <div className="stat-label">Email</div>
            <div style={{ fontSize: 16 }}>{cliente.email}</div>
          </div>
          <div className="card">
            <div className="stat-label">Status</div>
            <div style={{ fontSize: 16, textTransform: "capitalize" }}>{cliente.status}</div>
          </div>
        </div>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>
          Histórico de respostas
        </h2>

        {rodadas.length === 0 && (
          <div className="card" style={{ color: "var(--ink-soft)" }}>
            Este cliente ainda não respondeu nenhum NPS.
          </div>
        )}

        {rodadas.map((rodada, i) => {
          const notaPrincipal = rodada.itens.find((it) => it.ordem === 1);
          return (
            <div key={i} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17 }}>
                    {rodada.survey_titulo}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    Respondido por {rodada.respondente_nome} em{" "}
                    {new Date(rodada.respondido_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                {notaPrincipal && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                      {notaPrincipal.nota}
                    </div>
                  </div>
                )}
              </div>

              {rodada.itens
                .sort((a, b) => a.ordem - b.ordem)
                .map((item) => (
                  <div key={item.ordem} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      {item.pergunta}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                      {item.tipo === "nota" ? `Nota: ${item.nota}` : item.resposta_texto || "—"}
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
