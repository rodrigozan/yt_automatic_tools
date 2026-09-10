# URS — Automação de Geração de Vídeos Longos Narrativos

**Projeto:** YT Automatic Tools — módulo de vídeos narrativos longos (drama de época / storytelling)
**Versão:** 1.0
**Status:** Para implementação via Claude Code

---

## 1. Objetivo

Implementar um pipeline automatizado que gere vídeos narrativos longos (formato drama/romance de época, ~50–90 min) do roteiro até o arquivo final de vídeo, mantendo continuidade narrativa entre capítulos através de uma "story bible" persistida, e usando OpenRouter como camada única de acesso a modelos de LLM, imagem e TTS.

## 2. Escopo

### Incluso
- Geração de premissa e estrutura narrativa (agente de planejamento)
- Geração de capítulos individuais com base na story bible (agente de roteiro)
- Verificação de continuidade entre capítulos, com regeneração automática em caso de erro (agente de continuidade)
- Geração de prompts visuais por capítulo (agente visual)
- Geração de narração via TTS
- Geração de metadados de publicação (título, descrição, tags, hashtags)
- Persistência da story bible e dos capítulos em MongoDB
- Chamada à API local existente (montagem de vídeo via FFmpeg) como etapa final
- Orquestração via um único serviço Node.js/TypeScript, integrado ao repositório `yt_automatic_tools`

### Fora de escopo (nesta versão)
- Geração das imagens em si (feature consome apenas os *prompts*; geração de imagem via Gemini/Nano Banana é tratada por serviço já existente ou a ser especificado à parte)
- Publicação automática no YouTube (a feature entrega os metadados; upload via YouTube Data API já existe no projeto e não é alterado aqui)
- Interface visual/dashboard para acompanhar o pipeline (fora do MVP)
- Multi-idioma (MVP é pt-BR / conteúdo em português)

## 3. Definições

| Termo | Definição |
|---|---|
| Story bible | Documento estruturado com premissa, personagens, regras do universo, tom e estado narrativo, persistido e reenviado como contexto reduzido a cada chamada |
| Capítulo | Unidade de roteiro de 900–1.400 palavras, gerada por chamada individual à LLM |
| Agente | Função de orquestração que chama um modelo via OpenRouter com um `system prompt` especializado (não é um processo ou framework separado) |
| Pipeline run | Execução completa, do planejamento até o vídeo final, para uma história |

## 4. Requisitos Funcionais

### RF01 — Criação da Story Bible
O sistema deve gerar, a partir de um briefing de entrada (gênero, período, tom, premissa livre opcional), uma story bible estruturada contendo: título, gênero, período/local, tom (lista), lista de personagens (nome, papel, idade, aparência, personalidade, segredo, relações), regras da narrativa, objetivo central da história, e lista de eventos-chave planejados por capítulo (outline).

**Critério de aceite:** a story bible gerada é validável contra o schema definido (seção 6) e persistida no MongoDB antes de qualquer capítulo ser gerado.

### RF02 — Definição do número de capítulos e duração
O sistema deve calcular o número de capítulos e palavras-alvo por capítulo a partir da duração desejada do vídeo final, usando a métrica de referência de 130–150 palavras por minuto de narração.

**Critério de aceite:** para uma duração-alvo informada, o sistema apresenta número de capítulos e faixa de palavras por capítulo, ajustável manualmente antes de iniciar a geração.

### RF03 — Geração de capítulo individual
Para cada capítulo, o sistema deve montar um prompt contendo: a story bible completa (ou sua versão resumida, conforme RF07), o resumo dos capítulos anteriores, o outline do capítulo atual, e instruções de estilo. O modelo deve retornar o texto do capítulo dentro da faixa de palavras definida.

**Critério de aceite:** capítulo gerado, persistido com número sequencial, contagem de palavras dentro de ±15% da meta, e vinculado ao `pipeline_run_id`.

### RF04 — Verificação de continuidade
Após a geração de cada capítulo (a partir do 2º), o sistema deve executar uma chamada de verificação de continuidade comparando o capítulo novo contra a story bible e o resumo acumulado, checando pelo menos: idade e aparência de personagens, ordem de eventos, ritmo do romance/conflito, não revelação prematura de segredos, e repetição de frases/estruturas.

**Critério de aceite:** a verificação retorna uma lista estruturada de problemas (`[]` se nenhum) com severidade (`bloqueante` / `alerta`).

### RF05 — Regeneração automática em caso de erro bloqueante
Se a verificação de continuidade (RF04) retornar ao menos um problema `bloqueante`, o sistema deve regenerar o capítulo automaticamente, reenviando o prompt original acrescido da lista de problemas encontrados como instrução de correção, até um número máximo configurável de tentativas (padrão: 2).

**Critério de aceite:** capítulo só é marcado como aprovado quando não há problemas bloqueantes, ou quando o limite de tentativas é atingido (nesse caso, o capítulo é marcado como `revisão_manual_necessária` e o pipeline não trava).

### RF06 — Atualização incremental do resumo
Após aprovação de cada capítulo, o sistema deve gerar e persistir um resumo curto (100–200 palavras) do capítulo, a ser usado como contexto nos capítulos seguintes em vez do texto completo.

**Critério de aceite:** a partir do capítulo 3, o prompt de geração usa resumos acumulados, não os textos completos dos capítulos anteriores.

### RF07 — Compactação de contexto
O sistema deve montar o contexto enviado a cada chamada usando: story bible completa (sempre) + resumos de todos os capítulos anteriores (sempre) + texto completo apenas do capítulo imediatamente anterior (para continuidade de tom/fala). Nunca deve reenviar o texto completo de todos os capítulos anteriores.

**Critério de aceite:** tamanho do prompt de geração de capítulo não cresce linearmente com o número de capítulos além do previsto pelos resumos.

### RF08 — Geração de prompts visuais
Ao final da aprovação de todos os capítulos, o sistema deve gerar uma lista de prompts de imagem (estilo cinematográfico, hiper-realista, época/local definidos na story bible), na proporção de 1 prompt a cada 4–8 segundos de narração estimada do trecho correspondente.

**Critério de aceite:** cada prompt visual é vinculado a um intervalo de tempo estimado e a um capítulo/trecho de origem.

### RF09 — Geração de narração (TTS)
O sistema deve enviar o texto de cada capítulo aprovado para o endpoint de TTS (via OpenRouter) e salvar o áudio resultante, mantendo a ordem e possibilitando concatenação posterior.

**Critério de aceite:** um arquivo de áudio por capítulo é gerado, salvo com nome padronizado (`{pipeline_run_id}_cap{n}.mp3`), com duração compatível com a estimativa de palavras.

### RF10 — Geração de metadados de publicação
O sistema deve gerar, a partir da story bible e do texto completo (ou resumos), um pacote de metadados: título (com variações), descrição (mínimo 4 parágrafos, conforme padrão já estabelecido do canal), tags/keywords (linha única separada por vírgula), e pergunta reflexiva final para engajamento.

**Critério de aceite:** metadados persistidos e associados ao `pipeline_run_id`, prontos para consumo pelo módulo de publicação já existente.

### RF11 — Chamada à API local de montagem de vídeo
Ao final das etapas RF08–RF10, o sistema deve chamar a API local existente, enviando: lista ordenada de áudios, lista ordenada de prompts/imagens (ou imagens já geradas, conforme integração vigente), e configuração de transições, para montagem do vídeo final via FFmpeg.

**Critério de aceite:** vídeo final gerado e path/URL retornado persistido no registro do `pipeline_run`.

### RF12 — Persistência e rastreabilidade
Todo o estado do pipeline (story bible, capítulos, resumos, verificações de continuidade, tentativas de regeneração, prompts visuais, áudios, metadados, status de cada etapa) deve ser persistido no MongoDB, permitindo retomar um `pipeline_run` interrompido a partir da última etapa concluída.

**Critério de aceite:** ao reiniciar o processo após falha, o sistema não repete etapas já concluídas com sucesso.

## 5. Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF01 | Toda chamada a modelo externo deve passar por OpenRouter (endpoint único), nunca por automação de navegador/UI de terceiros |
| RNF02 | Cada chamada de API (por capítulo, por verificação, por prompts visuais, por metadados) deve ser idempotente e reexecutável sem duplicar dados |
| RNF03 | Falha em uma chamada de modelo deve ter retry configurável (padrão: 3 tentativas, backoff exponencial) antes de marcar a etapa como falha |
| RNF04 | Custo estimado por `pipeline_run` deve ser calculável e logado (tokens de entrada/saída por chamada, custo de TTS por caractere/segundo, conforme tabela de preços do OpenRouter) |
| RNF05 | Tempo total do pipeline (sem geração de imagem/vídeo final) deve ser compatível com execução assíncrona em background, sem bloquear outras rotinas do serviço |
| RNF06 | Toda a lógica deve ser implementada em TypeScript, seguindo os padrões já existentes no repositório `yt_automatic_tools` (Express, MongoDB, camadas Model/Service/Controller/Router) |
| RNF07 | Nenhuma credencial (OpenRouter API key) deve ser exposta em logs ou respostas de API |

## 6. Modelo de Dados (MongoDB)

### Collection `story_bibles`
```json
{
  "_id": "ObjectId",
  "pipeline_run_id": "ObjectId",
  "title": "string",
  "genre": "string",
  "period": "string",
  "location": "string",
  "tone": ["string"],
  "characters": [
    {
      "name": "string",
      "role": "string",
      "age": "number",
      "appearance": "string",
      "personality": ["string"],
      "secret": "string | null",
      "relationships": [{ "with": "string", "type": "string" }]
    }
  ],
  "story_rules": ["string"],
  "central_goal": "string",
  "outline": [
    { "chapter_number": "number", "summary_planned": "string" }
  ],
  "created_at": "date"
}
```

### Collection `chapters`
```json
{
  "_id": "ObjectId",
  "pipeline_run_id": "ObjectId",
  "chapter_number": "number",
  "text": "string",
  "word_count": "number",
  "summary": "string",
  "status": "draft | approved | revisão_manual_necessária",
  "continuity_checks": [
    {
      "attempt": "number",
      "issues": [{ "description": "string", "severity": "bloqueante | alerta" }],
      "checked_at": "date"
    }
  ],
  "created_at": "date"
}
```

### Collection `pipeline_runs`
```json
{
  "_id": "ObjectId",
  "target_duration_minutes": "number",
  "chapters_planned": "number",
  "words_per_chapter_target": { "min": "number", "max": "number" },
  "status": "planning | writing | visual_prompts | narration | metadata | video_assembly | completed | failed",
  "current_step": "string",
  "visual_prompts": [
    { "chapter_number": "number", "time_range": "string", "prompt": "string" }
  ],
  "narration_files": [{ "chapter_number": "number", "path": "string" }],
  "metadata": {
    "titles": ["string"],
    "description": "string",
    "tags": "string",
    "closing_question": "string"
  },
  "final_video_path": "string | null",
  "created_at": "date",
  "updated_at": "date"
}
```

## 7. Fluxo do Pipeline

1. Entrada: briefing + duração-alvo → **RF01 + RF02** → story bible + plano de capítulos
2. Loop por capítulo (1..N):
   a. **RF03** gera capítulo
   b. **RF04** verifica continuidade
   c. Se bloqueante → **RF05** regenera (até limite) → volta a (b)
   d. **RF06** gera resumo do capítulo aprovado
3. **RF08** gera prompts visuais para todos os capítulos
4. **RF09** gera narração (paralelizável por capítulo)
5. **RF10** gera metadados de publicação
6. **RF11** chama API local de montagem de vídeo
7. **RF12** persiste e expõe status final do `pipeline_run`

## 8. Integrações

| Etapa | Provedor / Endpoint |
|---|---|
| Planejamento, roteiro, continuidade, metadados | OpenRouter — `/chat/completions` (modelo configurável por etapa) |
| Narração | OpenRouter — `/audio/speech` |
| Imagem (fora de escopo desta feature, mas consumidora dos prompts) | Serviço de imagem já existente (Gemini) |
| Montagem final de vídeo | API local existente (FFmpeg) — endpoint HTTP já em produção |

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Modelo ignora limite de palavras por capítulo | Validação pós-geração com re-prompt automático se fora da faixa |
| Loop de regeneração não converge | Limite máximo de tentativas (RF05) com fallback para revisão manual |
| Custo de tokens crescer com número de capítulos | Compactação de contexto obrigatória (RF07); monitorar RNF04 |
| Inconsistência entre prompts visuais e conteúdo narrado | Vincular cada prompt a um capítulo/trecho de origem (RF08) |

## 10. Critérios de Aceite Gerais da Feature

- Pipeline completo executa fim a fim para uma história de teste (duração-alvo configurável) sem intervenção manual, exceto nos casos de `revisão_manual_necessária`.
- Todos os dados intermediários são recuperáveis via consulta ao MongoDB.
- Nenhuma chamada de rede é feita a serviços de terceiros fora do OpenRouter e da API local de montagem de vídeo.
- Custo total estimado do pipeline é reportado ao final da execução.