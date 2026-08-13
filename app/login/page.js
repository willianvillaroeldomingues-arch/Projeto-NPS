"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro("Email ou senha incorretos.");
      return;
    }
    router.push("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={entrar}
        className="card"
        style={{ width: 340, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <div className="stat-label">Acesso da equipe</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>
            Entrar no painel de NPS
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border-input)",
              background: "var(--card-input)",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Senha
          </label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border-input)",
              background: "var(--card-input)",
            }}
          />
        </div>

        {erro && <p style={{ color: "var(--error)", fontSize: 13 }}>{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          style={{
            padding: "12px",
            background: "var(--ink)",
            color: "#f2e9d8",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            opacity: carregando ? 0.6 : 1,
          }}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
