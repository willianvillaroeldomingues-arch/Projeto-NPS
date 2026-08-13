"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ResponderPage() {
  const { token } = useParams();
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [contexto, setContexto] = useState(null);

  const [etapa, setEtapa] = useState(0);
  const [nome, setNome] = useState("");
  const [respostas, setRespostas] = useState({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    async function carregar() {
      const res = await fetch(`/api/nps/link?token=${token}`);
      const data = await res.json();
      if (!res.ok) {
        setErroCarregamento(data.erro || "Não foi possível carregar o formulário.");
      } else {
        setContexto(data);
      }
      setCarregando(false);
    }
    carregar();
  }, [token]);

  if (carregando) {
    return <TelaCentral><p>Carregando formulário...</p></TelaCentral>;
  }

  if (erroCarregamento) {
    return (
      <TelaCentral>
        <p style={{ color: "var(--error)", fontSize: 15 }}>{erroCarregamento}</p>
      </TelaCentral>
    );
  }

  const perguntas = contexto.perguntas;
  const perguntaAtual = etapa >= 1 && etapa <= perguntas.length ? perguntas[etapa - 1] : null;
  const valorAtual = perguntaAtual ? respostas[perguntaAtual.id] ?? "" : "";

  function validarEAvancar() {
    if (etapa === 0) {
      if (!nome.trim()) {
        setErro("Por favor, informe seu nome para continuar.");
        return;
      }
      setErro("");
      setEtapa(1);
      return;
    }
    if (perguntaAtual) {
      const valor = respostas[perguntaAtual.id];
      const vazio =
        perguntaAtual.tipo === "nota" ? valor === undefined : !valor || !String(valor).trim();
      if (perguntaAtual.obrigatoria && vazio) {
        setErro("Essa pergunta é obrigatória.");
        return;
      }
      setErro("");
      if (etapa === perguntas.length) {
        enviarFormulario();
      } else {
        setEtapa(etapa + 1);
      }
    }
  }

  function voltar() {
    setErro("");
    if (etapa > 0) setEtapa(etapa - 1);
  }

  function responderNota(nota) {
    setRespostas((prev) => ({ ...prev, [perguntaAtual.id]: nota }));
    setErro("");
  }

  function responderTexto(valor) {
    setRespostas((prev) => ({ ...prev, [perguntaAtual.id]: valor }));
  }

  async function enviarFormulario() {
    setEnviando(true);
    setErro("");
    const res = await fetch("/api/nps/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nome, respostas }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro || "Não foi possível enviar. Tente novamente.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--parchment)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "var(--font-display)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 18px 40px -20px rgba(22,50,79,0.35)",
        }}
      >
        <div
          style={{
            background: "var(--ink)",
            color: "#f2e9d8",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="eyebrow">Acompanhamento do processo</div>
            <div style={{ fontSize: 20, marginTop: 2 }}>Como está sendo sua experiência?</div>
          </div>
          {etapa >= 1 && etapa <= perguntas.length && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, opacity: 0.85 }}>
              {etapa} / {perguntas.length}
            </div>
          )}
        </div>

        {etapa >= 1 && etapa <= perguntas.length && (
          <div style={{ display: "flex", gap: 5, padding: "14px 28px 0" }}>
            {perguntas.map((p, i) => (
              <div
                key={p.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i < etapa ? "var(--gold)" : "var(--border)",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ padding: "32px 28px 28px" }}>
          {enviado ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "2px solid var(--gold)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  margin: "0 auto 18px",
                }}
              >
                ✓
              </div>
              <p style={{ fontSize: 19, color: "var(--ink)", marginBottom: 8 }}>
                Obrigado, {nome.split(" ")[0]}.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#7a6a4e", lineHeight: 1.6 }}>
                Sua resposta foi registrada e vai nos ajudar a melhorar sua experiência ao longo
                do processo.
              </p>
            </div>
          ) : (
            <>
              {etapa === 0 && (
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 24 }}>
                    Gostaríamos de saber como tem sido sua experiência conosco até agora. Sua
                    opinião é muito importante para garantirmos a melhor experiência possível.
                  </p>
                  <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Seu nome completo <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && validarEAvancar()}
                    placeholder="Digite seu nome"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      fontSize: 15,
                      fontFamily: "var(--font-body)",
                      border: "1px solid var(--border-input)",
                      background: "var(--card-input)",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              {perguntaAtual && (
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: 10 }}>
                    {perguntaAtual.tipo === "nota" ? "Avaliação" : "Comentário"}
                  </div>
                  <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--ink)", marginBottom: 20 }}>
                    {perguntaAtual.texto}
                  </p>

                  {perguntaAtual.tipo === "nota" ? (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Array.from({ length: 11 }, (_, n) => n).map((n) => {
                        const selecionado = valorAtual === n;
                        return (
                          <button
                            key={n}
                            onClick={() => responderNota(n)}
                            style={{
                              width: 40,
                              height: 40,
                              fontFamily: "var(--font-body)",
                              fontSize: 14,
                              fontWeight: 600,
                              border: selecionado ? "2px solid var(--ink)" : "1px solid var(--border-input)",
                              background: selecionado ? "var(--ink)" : "var(--card-input)",
                              color: selecionado ? "#f2e9d8" : "var(--ink-soft)",
                              cursor: "pointer",
                            }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      autoFocus
                      value={valorAtual}
                      onChange={(e) => responderTexto(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      rows={5}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 14px",
                        fontSize: 14.5,
                        fontFamily: "var(--font-body)",
                        border: "1px solid var(--border-input)",
                        background: "var(--card-input)",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  )}
                </div>
              )}

              {erro && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--error)", marginTop: 16 }}>
                  {erro}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
                <button
                  onClick={voltar}
                  disabled={etapa === 0}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13.5,
                    color: etapa === 0 ? "var(--border-input)" : "#7a6a4e",
                    background: "none",
                    border: "none",
                    cursor: etapa === 0 ? "default" : "pointer",
                    padding: "8px 0",
                  }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={validarEAvancar}
                  disabled={enviando}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f2e9d8",
                    background: "var(--ink)",
                    border: "none",
                    padding: "12px 26px",
                    cursor: enviando ? "default" : "pointer",
                    opacity: enviando ? 0.6 : 1,
                  }}
                >
                  {enviando
                    ? "Enviando..."
                    : etapa === perguntas.length
                    ? "Enviar respostas"
                    : etapa === 0
                    ? "Começar"
                    : "Próxima"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TelaCentral({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--parchment)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </div>
  );
}
