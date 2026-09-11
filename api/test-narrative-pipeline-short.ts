const BASE_URL = 'http://localhost:4500/api';
const POLL_INTERVAL_MS = 8000;
const MAX_POLL_MINUTES = 30;

interface TestPayload {
  genre: string;
  period: string;
  tone: string;
  premise: string;
  targetDurationMinutes: number;
  chaptersPlanned: number;
  wordsPerChapterTarget: { min: number; max: number };
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
  final_video_path?: string | null;
  chapters?: Chapter[];
  [key: string]: unknown;
}

const testPayload: TestPayload = {
  genre: 'drama romântico de época',
  period: 'Inglaterra, 1818',
  tone: 'melancólico, cinematográfico, emocional, romântico, misterioso',
  premise:
    'Emma Whitmore, uma criada observadora e reservada, encontra por acaso o filho do patriarca da casa em decadência onde trabalha, à luz de velas, numa noite de tempestade — e um segredo guardado por anos ameaça vir à tona.',
  targetDurationMinutes: 2,
  chaptersPlanned: 1,
  wordsPerChapterTarget: { min: 260, max: 320 },
};

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
  console.log('--- RUN CRIADO (teste curto, ~2min) ---');
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

    if (chapters) console.log(summarizeChapters(chapters));

    if (run.status === 'failed') {
      console.log('\n--- PIPELINE FALHOU ---');
      console.log(JSON.stringify(run, null, 2));
      throw new Error(`Pipeline retornou status failed: ${run.error_message ?? '(sem mensagem)'}`);
    }

    if (run.status === 'video_assembly' && run.current_step === 'aguardando_chamada_manual_de_montagem') {
      console.log('\n--- GERAÇÃO AUTOMÁTICA CONCLUÍDA (aguardando montagem do vídeo) ---');
      return run;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Timeout de ${MAX_POLL_MINUTES}min sem conclusão`);
}

async function assemble(runId: string): Promise<PipelineRun> {
  console.log('\n--- CHAMANDO /assemble (gera imagem real via Gemini + monta vídeo com FFmpeg) ---');
  const res = await fetch(`${BASE_URL}/narrative-pipeline/runs/${runId}/assemble`, { method: 'POST' });
  const body = await res.json();

  if (!res.ok) {
    console.log(JSON.stringify(body, null, 2));
    throw new Error(`Falha ao montar vídeo: ${res.status}`);
  }

  return body.data as PipelineRun;
}

async function main(): Promise<void> {
  const run = await createRun();
  const runId = (run._id || run.id) as string;

  await poll(runId);

  const finalRun = await assemble(runId);
  console.log('\n--- VÍDEO FINAL PRONTO ---');
  console.log('final_video_path:', finalRun.final_video_path);
}

main().catch((err: Error) => {
  console.error('\n❌ ERRO NO TESTE:', err.message);
  process.exit(1);
});
