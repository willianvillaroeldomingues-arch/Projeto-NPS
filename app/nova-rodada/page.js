"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useAuthGuard } from "../../lib/useAuthGuard";

export default function NovaRodadaPage() {
  const pronto = useAuthGuard();
  const [titulo, setTitulo] = useState("");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [clientesAtivos, setClientesAtivos] = useState([]);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");
  const [linksGerados, setLinksGerados] = useState(null);

  useEffect(() => {
    if (!pronto) return;
    supabase
      .from("clients")
      .select("id, nome")
      .eq("status", "ativo")
      .order("nome")
      .then(({ data }) => setClientesAtivos(data || []));
  }, [pronto]);

  if (!pronto) return null;

  async function criarRodada() {
    setErro("");
    if (!titulo.trim()) {
      setErro("Dê um título para a rodada, ex: NPS Outubro/2026");
      return;
    }
    if (clientesAtivos.length === 0) {
      setErro("Não há clientes ativos cadastrados.");
      return;
    }
    setCriando(true);

    const mesReferencia = `${mes}-01`;

    const { data: survey, error: erroSurvey } = await supabase
      .from("nps_surveys")
      .insert({ titulo, mes_referencia: mesReferencia })
      .select()
      .single();

    if (erroSurvey) {
      setCriando(false);
      setErro(
        erroSurvey.message.includes("duplicate")
          ? "Já existe uma rodada criada para esse mês."
          : "Erro ao criar a rodada."
      );
      return;
    }

    const linksParaCriar = clientesAtivos.map((c) => ({
      survey_id: survey.id,
      client_id: c.id,
    }));

    const { data: links, error: erroLinks } = await supabase
      .from("nps_form_links")
      .insert(linksParaCriar)
      .select("token, client_id");

    setCriando(false);

    if (erroLinks) {
      setErro("Rodada criada, mas houve erro ao gerar os links.");
      return;
    }

    const base = typeof window !== "undefined" ? window.location.origin : "";
    const resultado = links.map((l) => {
      const cliente = clientesAtivos.find((c) => c.id === l.client_id);
      return { nome: cliente?.nome, url: `${base}/responder/${l.token}` };
    });
    setLinksGerados(resultado);
  }

  return (
    <div>
      <div className="top-bar">
        <Link href="/" style={{ color: "#f2e9d8", fontSize: 13, textDecoration: "none", opacity: 0.8 }}>
          ← Voltar
        </Link>
        <div className="eyebrow" style={{ marginTop: 10 }}>
          Nova campanha
        </div>
        <div className="title">Criar rodada de NPS</div>
      </div>

      <div className="container">
        {!linksGerados ? (
          <div className="card" style={{ maxWidth: 480 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Título da rodada
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: NPS Outubro/2026"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-input)",
                  background: "var(--card-input)",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Mês de referência
              </label>
              <input
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-input)",
                  background: "var(--card-input)",
                }}
              />
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
              Serão gerados links individuais para os {clientesAtivos.length} clientes ativos.
            </p>

            {erro && <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

            <button
              onClick={criarRodada}
              disabled={criando}
              style={{
                padding: "12px 20px",
                background: "var(--ink)",
                color: "#f2e9d8",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                opacity: criando ? 0.6 : 1,
              }}
            >
              {criando ? "Gerando..." : "Criar rodada e gerar links"}
            </button>
          </div>
        ) : (
          <div className="card">
            <p style={{ marginBottom: 16, fontSize: 14 }}>
              Rodada criada! Envie o link correspondente para cada cliente (email, WhatsApp, etc):
            </p>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Link do formulário</th>
                </tr>
              </thead>
              <tbody>
                {linksGerados.map((l, i) => (
                  <tr key={i}>
                    <td>{l.nome}</td>
                    <td style={{ fontSize: 12, wordBreak: "break-all" }}>{l.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
