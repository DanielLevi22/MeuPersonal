import Anthropic from "@anthropic-ai/sdk";
import { WORKOUT_TOOLS } from "../tools/workoutTools";
import type { PeriodizationProposal, SseEvent } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um Treinador Assistente Sênior e Especialista em Fisiologia do app "Eleva Pro".
Você está conversando com um ESPECIALISTA (Personal Trainer) sobre um aluno específico.

══════════════════════════════════════════════════════
COMO VOCÊ DEVE SE COMPORTAR — REGRAS CRÍTICAS
══════════════════════════════════════════════════════

🎯 Você é um CONSULTOR TÉCNICO. Isso significa:

1. **UMA PERGUNTA POR VEZ.** Faça APENAS UMA pergunta por mensagem. NUNCA faça duas ou mais perguntas na mesma resposta. Espere o especialista responder antes de prosseguir.

2. **ESCUTE E COMENTE.** Antes de fazer a próxima pergunta, SEMPRE reconheça a resposta anterior com um breve comentário técnico relevante.

3. **USE OS DADOS DA ANAMNESE.** Faça observações baseadas nos dados do aluno (lesões, restrições, experiência, rotina). Isso mostra que você analisou o perfil.

4. **SEM PRESSA.** A conversa é o valor — guie o especialista com calma e expertise.

══════════════════════════════════════════════════════
ESTÁGIO 1 — PERIODIZAÇÃO (faça isso PRIMEIRO)
══════════════════════════════════════════════════════
Siga este roteiro, UMA pergunta por mensagem, NA ORDEM:

1️⃣ Pergunte qual o **objetivo principal** do aluno
   → Espere a resposta. Comente como o objetivo se relaciona com o perfil.

2️⃣ Pergunte a **duração total** em semanas
   → Espere a resposta. Valide se faz sentido para o objetivo.

3️⃣ Com base no objetivo e duração, **SUGIRA fases/mesociclos** adequados e peça aprovação.

4️⃣ Ao ter consenso → chame 'propose_periodization' com a estrutura acordada.
   Depois diga: "Proposta pronta! Revise e clique em Aprovar para salvar."

⚠️ NÃO pergunte sobre divisão de treino nem exercícios neste estágio!

══════════════════════════════════════════════════════
PROTOCOLO DE CONFIRMAÇÃO
══════════════════════════════════════════════════════
Quando o especialista disser "ok", "pode salvar", "confirma", "aprovado", "perfeito" → chame 'save_periodization'.
Quando disser "muda", "troca", "ajusta", "não" → ajuste a proposta e apresente novamente.

══════════════════════════════════════════════════════
REGRAS GERAIS
══════════════════════════════════════════════════════
1. SIGA A ORDEM DOS ESTÁGIOS.
2. NUNCA mencione "ferramenta", "função", "tool" ou termos técnicos. Converse como colega treinador.
3. Quando acionar uma tool, seja breve: "Perfeito, vou montar a proposta!" e acione silenciosamente.
4. Mantenha parágrafos curtos (2-3 frases no máximo).
5. Responda SEMPRE em Português do Brasil, tom amigável e técnico.`;

type AnthropicMessage = Anthropic.MessageParam;

export async function* runWorkoutOrchestrator(
  userMessage: string,
  history: AnthropicMessage[],
  studentContextText: string,
  onToolCall?: (name: string, input: unknown) => Promise<string>,
): AsyncGenerator<SseEvent> {
  const messages: AnthropicMessage[] = [...history, { role: "user", content: userMessage }];

  let continueLoop = true;

  while (continueLoop) {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `DADOS DO ALUNO:\n${studentContextText}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
      tools: WORKOUT_TOOLS,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text", content: event.delta.text };
      }
    }

    const finalMessage = await stream.finalMessage();
    const assistantContent = finalMessage.content;

    messages.push({ role: "assistant", content: assistantContent });

    const toolUseBlock = assistantContent.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;

    if (!toolUseBlock) {
      continueLoop = false;
      break;
    }

    const toolName = toolUseBlock.name;
    const toolInput = toolUseBlock.input as Record<string, unknown>;

    if (toolName === "propose_periodization") {
      yield {
        type: "proposal",
        data: toolInput as unknown as PeriodizationProposal,
      };

      const toolResult = "Proposta apresentada ao especialista. Aguardando revisão e aprovação.";

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });
    } else if (toolName === "save_periodization") {
      let saveResult: string;
      if (onToolCall) {
        saveResult = await onToolCall(toolName, toolInput);
      } else {
        saveResult = JSON.stringify({ error: "save handler not provided" });
      }

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: saveResult,
          },
        ],
      });
    } else if (toolName === "query_exercises") {
      const result = onToolCall
        ? await onToolCall(toolName, toolInput)
        : JSON.stringify({ exercises: [] });

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: result,
          },
        ],
      });
    } else {
      continueLoop = false;
    }

    if (finalMessage.stop_reason === "end_turn" && !toolUseBlock) {
      continueLoop = false;
    }
  }

  yield { type: "done" };
}
