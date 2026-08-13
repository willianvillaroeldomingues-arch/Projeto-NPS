import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ erro: "Token não informado." }, { status: 400 });
  }

  const { data: link, error } = await supabaseAdmin
    .from("nps_form_links")
    .select("id, respondido, client_id, survey_id, clients(nome), nps_surveys(titulo, status)")
    .eq("token", token)
    .single();

  if (error || !link) {
    return NextResponse.json({ erro: "Link inválido." }, { status: 404 });
  }

  if (link.respondido) {
    return NextResponse.json({ erro: "Este formulário já foi respondido." }, { status: 409 });
  }

  if (link.nps_surveys?.status !== "aberto") {
    return NextResponse.json({ erro: "Esta rodada de NPS já foi encerrada." }, { status: 409 });
  }

  const { data: perguntas } = await supabaseAdmin
    .from("nps_questions")
    .select("id, ordem, tipo, texto, obrigatoria")
    .eq("ativa", true)
    .order("ordem");

  return NextResponse.json({
    formLinkId: link.id,
    clientId: link.client_id,
    surveyId: link.survey_id,
    clienteNome: link.clients?.nome,
    surveyTitulo: link.nps_surveys?.titulo,
    perguntas: perguntas || [],
  });
}
