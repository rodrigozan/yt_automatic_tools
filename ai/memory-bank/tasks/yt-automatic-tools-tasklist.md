# YT Automatic Tools — Tarefas de proposta de design e layout

## Resumo da especificação
**Objetivo**: apresentar uma proposta completa de design e layout do web, com mockups e justificativas, para análise do cliente antes da implementação.
**Requisitos originais**:
- “usem a skill apple-design, frontend-design, motion e ui-ux-pro-max”
- “propor um refactory completo no design e layout”
- “Quero mockups e uma explicação do motivo da nova proposta”
- “aguardar eu analisar minhas considerações antes de prosseguir”
- “podem colocar os agentes de design nessa task”

**Fonte**: pedido do cliente nesta conversa. `ai/memory-bank/site-setup.md` não encontrado; não foi substituído por uma especificação presumida.
**Stack verificada**: React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7, Lucide, Axios (`web/package.json`). API existente: Node.js/Express e MongoDB, conforme `README.md`. O README menciona Shadcn/UI, mas seu uso deve ser confirmado no inventário. Laravel, Livewire e FluxUI não se aplicam à stack encontrada.
**Prazo**: não informado. Blocos abaixo estimados em 30–60 minutos cada; cobertura completa pode exigir repetição por tela.
**Responsável pelo encaminhamento**: Leo Valdez (`desenvolvimento`), para coordenar desenvolvimento e consolidar a proposta com Ororo (`design`). Referência organizacional: `projetos/agentes-phanterclaw.md` e `projetos/agentes/design.md`, fornecidos pelo cliente, somente leitura.
**Status**: execução encaminhada a Leo Valdez (`desenvolvimento`) em 2026-10-23 para consolidação com Design. As quatro skills foram localizadas em `/root/.claude/skills/{apple-design,frontend-design,motion,ui-ux-pro-max}/SKILL.md`. O status anterior de indisponibilidade está superado. QA somente após conclusão de Desenvolvimento e Design; correções retornam internamente até a proposta estar completa.

## Tarefas da fase autorizada

### [x] 1. Confirmar fontes e disponibilizar skills — Leo — 30 min
**Objetivo**: tornar executáveis as instruções do cliente.
**Requisitos**: localizar e ler apple-design, frontend-design, motion e ui-ux-pro-max; obter a especificação real, se existir.
**Aceite**: registrar caminho e orientações aplicadas de cada skill; registrar conflitos e lacunas; não declarar uso de skills indisponíveis.
**Arquivos**: documentação em `ai/memory-bank/`; nenhuma alteração no código.
**Referência**: requisito original de uso das quatro skills.

### [ ] 2. Inventariar interface e problemas observáveis — Leo com Ororo — 60 min
**Objetivo**: fundamentar a proposta nos fluxos existentes.
**Requisitos**: revisar layout, navegação, temas, componentes e telas listadas em `web/src/App.tsx`: Dashboard, Upload, Channels, History, Tools, Settings, Login, Signup, TermsOfService e DataDeletion.
**Aceite**: mapa de telas e ações atuais; evidências dos problemas observados; distinção entre observação e hipótese; sem acrescentar funcionalidades.
**Arquivos de referência**: `web/src/App.tsx`, `web/src/pages/`, `web/src/components/`, `web/src/layout/MainLayout.tsx`, `web/src/index.css`.

### [ ] 3. Definir direção visual e comportamento — Ororo com Leo — 60 min
**Objetivo**: estabelecer uma linguagem coerente para a proposta.
**Requisitos**: propor hierarquia, tipografia, cores, espaçamentos, navegação e comportamento responsivo; especificar animações com finalidade e alternativa de movimento reduzido, conforme as skills.
**Aceite**: cada decisão ligada a um problema do inventário; contraste e foco considerados; dependências propostas identificadas, sem instalação; preservação dos fluxos atuais.
**Entrega**: `ai/memory-bank/design/yt-automatic-tools-proposta.md`.

### [ ] 4. Produzir mockups do layout e telas — Ororo, consolidação por Leo — 60 min por grupo
**Objetivo**: permitir revisão visual concreta antes de qualquer implementação.
**Requisitos**: produzir imagens dos layouts desktop e mobile; cobrir todas as telas inventariadas, agrupando telas semelhantes; usar conteúdo ilustrativo identificado e sem dados sensíveis. Começar por Dashboard e Upload, depois Channels/History, Tools/Settings, Login/Signup e páginas legais.
**Aceite**: imagens legíveis e vinculadas às rotas; nenhuma tela omitida sem justificativa; estados relevantes de carregamento, vazio, erro e sucesso documentados conforme o fluxo existente; nenhuma ação nova apresentada como funcionalidade já disponível.
**Entrega**: imagens em `ai/memory-bank/design/mockups/` e índice na proposta.
**Referência**: “Quero mockups” e refatoração completa do design e layout.

### [ ] 5. Explicar proposta e avaliar viabilidade — Leo com Ororo — 60 min
**Objetivo**: tornar cada mudança compreensível e tecnicamente revisável.
**Requisitos**: apresentar problema atual → mudança proposta → benefício esperado; explicar navegação, hierarquia, responsividade e movimento; identificar impacto em componentes e integrações existentes.
**Aceite**: justificativas acompanhadas dos respectivos mockups; hipóteses identificadas; nenhuma promessa de melhoria quantitativa sem evidência; proposta compatível com React/Tailwind e contratos atuais da API.
**Entrega**: proposta consolidada por Leo, com imagens e limitações.

### [ ] 6. Revisar entrega e apresentar ao cliente — QA com Leo — 30–60 min
**Objetivo**: entregar material completo para decisão do cliente.
**Requisitos**: conferir cobertura das telas, consistência desktop/mobile, legibilidade e correspondência entre justificativas e imagens.
**Aceite**: Desenvolvimento e Design concluíram suas entregas antes da entrada do QA; checklist revisado; imagens acessíveis; nenhuma pendência corrigível em aberto; eventuais reprovações retornam internamente aos responsáveis e são revalidadas; entrega completa marcada “aguardando considerações do cliente”.
**Regra de parada**: após apresentar a proposta, aguardar análise e considerações do cliente antes de implementar a refatoração.

## Qualidade e limites
- [ ] Sem código de aplicação nesta fase; somente documentação e mockups.
- [ ] Sem ampliar funcionalidades ou migrar stack.
- [ ] Sem comandos de inicialização de servidor ou processos em segundo plano.
- [ ] Design responsivo obrigatório.
- [ ] Imagens externas somente Unsplash ou https://picsum.photos/; não usar Pexels nos mockups.
- [ ] Nenhuma instalação da biblioteca Motion presumida pelo nome da skill.
- [ ] QA visual da implementação fica para a fase posterior à análise do cliente. Verificar script e endereço reais antes de adaptar a referência `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots`; ambos não estão confirmados neste projeto.

## Próxima fase
Detalhar tarefas de implementação somente depois das considerações do cliente e do alinhamento da proposta. Toda demanda de desenvolvimento deve passar por Leo Valdez (`desenvolvimento`).

## Complemento de execução — 2026-10-23
**Instrução do cliente**: “Vocês devem resolver as pendências entre vocês”; “O QA só pode analisar após todos os departamentos terem concluído suas tasks”; “termine a tarefa completa e só depois me avise”.
**Escopo autorizado**: concluir a proposta e suas evidências sem pedir aprovações intermediárias. A implementação da refatoração permanece condicionada à análise posterior da proposta pelo cliente.
**Roteamento**: toda demanda técnica passa por Leo; Design produz e revisa os mockups; QA recebe o pacote completo. Usar modelos econômicos para inventário e conferências mecânicas; reservar maior capacidade para decisões visuais e análise de contratos complexos, com justificativa.

### [ ] 7. Conferir contratos e estados existentes — Leo / Backend — 30–60 min
**Objetivo**: garantir que o redesign represente ações suportadas pelo servidor atual.
**Requisitos**: mapear cada ação proposta ao cliente HTTP e às rotas/controladores existentes; identificar estados reais, erros e dados ilustrativos.
**Aceite**: matriz com referências de arquivos; nenhuma ação sem suporte apresentada como funcional; limitações existentes claramente diferenciadas da proposta; sem chamadas de publicação ou alteração de dados reais.
**Arquivos**: documento de contratos em `docs/design-proposal/`; leitura de `web/src/pages/`, `web/src/lib/api.ts`, `api/src/routers/` e `api/src/controllers/`.
**Referência**: preservar escopo da refatoração de design e layout e resolver a pendência técnica já registrada.

### [ ] 8. Preparar comparação e critérios visuais — Design / Leo — 30–60 min por grupo
**Objetivo**: permitir comparar a interface existente e a proposta sem inferências.
**Requisitos**: índice com desktop/mobile das dez telas e aliases das doze rotas; comparações antes/depois; justificativas vinculadas às imagens; regras de foco, contraste, largura móvel e movimento reduzido.
**Aceite**: arquivos de imagem legíveis e acessíveis; conteúdo ilustrativo sinalizado; evidências das quatro skills com caminho e decisão aplicada; ausência de transbordamento horizontal; estados documentados conforme contratos; QA registra inspeção visual efetiva após conclusão de todos os departamentos.
**Arquivos**: `docs/design-proposal/` e `ai/memory-bank/design/`.
**Referência**: “Quero mockups e uma explicação do motivo da nova proposta”.
