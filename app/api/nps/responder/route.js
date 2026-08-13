import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request) {
  const body = await request.json();
  const { token, nome, respostas } = body;

  if (!token || !nome || !respostas) {
    return NextResponse.json({ erro: "Dados incompletos." }, { status: 400 });
  }

  // Revalida o token no servidor antes de gravar qualquer coisa
  const { data: link, error: erroLink } = await supabaseAdmin
    .from("nps_form_links")
    .select("id, respondido, client_id, survey_id")
    .eq("token", token)
    .single();

  if (erroLink || !link) {
    return NextResponse.json({ erro: "Link inválido." }, { status: 404 });
  }
  if (link.respondido) {
    return NextResponse.json({ erro: "Este formulário já foi respondido." }, { status: 409 });
  }

  // Cria o cabeçalho da resposta
  const { data: resposta, error: erroResposta } = await supabaseAdmin
    .from("nps_responses")
    .insert({
      survey_id: link.survey_id,
      client_id: link.client_id,
      form_link_id: link.id,
      respondente_nome: nome,
    })
    .select()
    .single();

  if (erroResposta) {
    return NextResponse.json({ erro: "Não foi possível salvar sua resposta." }, { status: 500 });
  }

  // Grava cada pergunta respondida
  const linhas = Object.entries(respostas).map(([questionId, valor]) => {
    const ehNumero = typeof valor === "number";
    return {
      response_id: resposta.id,
      question_id: questionId,
      nota: ehNumero ? valor : null,
      texto: ehNumero ? null : valor,
    };
  });

  const { error: erroAnswers } = await supabaseAdmin.from("nps_answers").insert(linhas);

  if (erroAnswers) {
    return NextResponse.json({ erro: "Não foi possível salvar suas respostas." }, { status: 500 });
  }

  return NextResponse.json({ sucesso: true });
}
