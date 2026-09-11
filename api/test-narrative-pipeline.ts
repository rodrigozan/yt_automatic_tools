const BASE_URL = 'http://localhost:4500/api';
const POLL_INTERVAL_MS = 15000;
const MAX_POLL_MINUTES = 180;

interface TestPayload {
  genre: string;
  period: string;
  tone: string;
  premise: string;
  targetDurationMinutes: number;
}

interface ContinuityIssue {
  description: string;
  severity: 'bloqueante' | 'alerta';
}

interface ContinuityCheck {
  attempt: number;
  issues: ContinuityIssue[];
  checked_at: string;
}

interface Chapter {
  chapter_number: number;
  word_count?: number;
  status: 'draft' | 'approved' | 'revisao_manual_necessaria';
  continuity_checks?: ContinuityCheck[];
}

interface PipelineRun {
  _id?: string;
  id?: string;
  status: string;
  current_step: string;
  error_message?: string;
  chapters?: Chapter[];
  tokenUsage?: unknown;
  costs?: unknown;
  tokensUsed?: unknown;
  [key: string]: unknown;
}

const testPayload: TestPayload = {
  genre: 'drama romântico de época',
  period: 'Inglaterra, 1818',
  tone: 'melancólico, cinematográfico, emocional, romântico, misterioso',
  premise:
    'Emma Whitmore, uma criada observadora e reservada na casa de uma família aristocrática em decadência, esconde ser a herdeira desaparecida de uma linhagem nobre. Quando o patriarca da casa anuncia que se casará com qualquer uma de suas filhas para salvar a família da ruína financeira, uma tempestade de segredos, hierarquias sociais e um romance proibido começa a se desenrolar.',
  targetDurationMinutes: 86,
};

async function planStep(): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/narrative-pipeline/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetDurationMinutes: testPayload.targetDurationMinutes }),
  });
  const data = await res.json();
  console.log('--- PLAN ---');
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function createRun(): Promise<PipelineRun> {
  const res = await fetch(`${BASE_URL}/narrative-pipeline/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });
  if (res.status !== 202) {
    const text = await res.text();
    throw new Error(`Falha ao criar run: ${res.status} — ${text}`);
  }
  const { data: run } = (await res.json()) as { data: PipelineRun };
  console.log('--- RUN CRIADO ---');
  console.log(JSON.stringify(run, null, 2));
  return run;
}

interface RunStatusResponse {
  run: PipelineRun;
  storyBible?: unknown;
  chapters?: Chapter[];
}

async function getRun(id: string): Promise<RunStatusResponse> {
  const res = await fetch(`${BASE_URL}/narrative-pipeline/runs/${id}`);
  if (!res.ok) throw new Error(`Falha ao consultar run ${id}: ${res.status}`);
  const { data } = (await res.json()) as { data: RunStatusResponse };
  return data;
}

function summarizeChapters(chapters: Chapter[] = []): string {
  return chapters
    .map((c) => {
      const bloqueantes = (c.continuity_checks || [])
        .flatMap((ck) => ck.issues || [])
        .filter((i) => i.severity === 'bloqueante');
      return `  cap ${c.chapter_number}: ${c.status} | ${c.word_count ?? '?'} palavras | ${bloqueantes.length} problema(s) bloqueante(s)`;
    })
    .join('\n');
}

async function poll(runId: string): Promise<PipelineRun> {
  const deadline = Date.now() + MAX_POLL_MINUTES * 60 * 1000;
  let lastStep: string | null = null;

  while (Date.now() < deadline) {
    const { run, chapters } = await getRun(runId);

    if (run.current_step !== lastStep) {
      console.log(`\n[${new Date().toISOString()}] status=${run.status} step=${run.current_step}`);
      lastStep = run.current_step;
    }

    if (chapters) {
      console.log(summarizeChapters(chapters));
    }

    const usage = run.tokenUsage || run.costs || run.tokensUsed;
    if (usage) {
      console.log('--- CUSTO/TOKENS (bruto retornado pela API) ---');
      console.log(JSON.stringify(usage, null, 2));
    }

    const manualReview = (chapters || []).filter((c) => c.status === 'revisao_manual_necessaria');
    if (manualReview.length) {
      console.log(`\n⚠ ${manualReview.length} capítulo(s) precisam de revisão manual: ${manualReview.map((c) => c.chapter_number).join(', ')}`);
    }

    if (run.status === 'completed') {
      console.log('\n--- PIPELINE CONCLUÍDO ---');
      console.log(JSON.stringify(run, null, 2));
      return run;
    }

    if (run.status === 'failed') {
      console.log('\n--- PIPELINE FALHOU ---');
      console.log(JSON.stringify(run, null, 2));
      throw new Error(`Pipeline retornou status failed: ${run.error_message ?? '(sem mensagem)'}`);
    }

    if (run.status === 'video_assembly' && run.current_step === 'aguardando_chamada_manual_de_montagem') {
      console.log('\n--- GERAÇÃO AUTOMÁTICA CONCLUÍDA (aguardando montagem manual do vídeo) ---');
      console.log(JSON.stringify(run, null, 2));
      return run;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Timeout de ${MAX_POLL_MINUTES}min sem conclusão`);
}

function printAssembleTemplate(runId: string): void {
  console.log('\n--- PRÓXIMO PASSO MANUAL (assemble) ---');
  console.log('Gera as imagens reais (Gemini) por prompt visual e monta o vídeo final:');
  console.log(`curl -X POST ${BASE_URL}/narrative-pipeline/runs/${runId}/assemble`);
}

async function main(): Promise<void> {
  await planStep();
  const run = await createRun();
  const runId = (run._id || run.id) as string;
  await poll(runId);
  printAssembleTemplate(runId);
}

main().catch((err: Error) => {
  console.error('\n❌ ERRO NO TESTE:', err.message);
  process.exit(1);
});
