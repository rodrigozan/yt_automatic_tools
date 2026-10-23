# Contratos de API e estados da proposta de redesign

Leitura do estado atual em `web/src/pages`, `web/src/lib/api.ts` e `api/src`. `docs/design-proposal/current/` contém somente referências visuais: login, dashboard, exclusão, upload (desktop/mobile), termos, settings, canais vazio, histórico vazio e tools. As 10 telas funcionais correspondem a 12 paths porque Termos e Exclusão têm aliases.

## Rotas da aplicação

| Tela | Paths | Acesso / contrato visível |
|---|---|---|
| Termos | `/termos-de-servico`, `/termos` | Público, conteúdo estático. |
| Exclusão de dados | `/exclusao-de-dados`, `/data-deletion` | Público; solicita e consulta status via API. |
| Login | `/login` | Público; email/senha e Google OAuth. Usuário autenticado é redirecionado para `/`. |
| Cadastro | `/signup` | Público; email, senha e nome. Usuário autenticado é redirecionado para `/`. |
| Dashboard | `/` | Protegido pelo estado local de autenticação; carrega canais e vídeos. |
| Upload | `/upload` | Protegido; carrega canais, recebe arquivos/links e inicia orquestração. |
| Canais | `/channels` | Protegido; listar/editar, renovar token e iniciar OAuth YouTube/Meta. |
| Histórico | `/history` | Protegido; listar/filtrar e atualizar estatísticas. |
| Tools | `/tools` | Protegido; apenas placeholder, sem chamadas. |
| Settings | `/settings` | Protegido; tema local light/dark. |

Fonte de paths e guardas: [App.tsx](../../web/src/App.tsx#L21). O `ProtectedRoute` confere apenas token local e redireciona a `/login`; `AuthContext` limpa token expirado e armazena usuário/token em `localStorage` ([ProtectedRoute.tsx](../../web/src/components/ProtectedRoute.tsx), [AuthContext.tsx](../../web/src/contexts/AuthContext.tsx)).

## Endpoints usados pelas telas

Todas as URLs abaixo recebem prefixo `/api` no Express. O cliente Axios usa `baseURL: '/api'` e não configura interceptor nem header `Authorization` ([api.ts](../../web/src/lib/api.ts#L1), [Express.ts](../../api/src/config/Express.ts#L20)). “Sem auth” significa que o endpoint não tem middleware de autenticação de usuário no código atual; não implica recomendação de segurança.

| Tela / ação | Método e path | Auth no backend | Payload / resposta observada |
|---|---|---|---|
| Login com email | `POST /auth/login` | Nenhuma | `{email,password}` → `{user,token}`. 400 `{message}` email inválido; 401 `{message}` credenciais inválidas. Front valida email antes de enviar. |
| Login Google | `POST /auth/google` | Nenhuma; recebe credencial Google | `{token: credential}` → `{user,token}`; token Google inválido retorna 401 `{message}`. |
| Cadastro | `POST /auth/register` | Nenhuma | `{email,password,name}` → 201 `{user,token}`; email inválido/usuário existente retorna 400 `{message}`. |
| Dashboard, Canais e Upload: listar canais | `GET /youtube/channels?email=…` | Nenhuma | Email obrigatório → `{email,count,channels}`. Tela assume `channels[]`; falha retorna `{error}`. |
| Histórico e Dashboard: listar vídeos | `GET /history/videos?email=…[&channelId=…]` | Nenhuma | Email obrigatório → `{videos}`. Se `channelId` informado, serviço busca por canal; caso contrário, por email do usuário. |
| Upload: arquivo local | `POST /uploads/local` | Nenhuma | `multipart/form-data`, campo `file` → `{message,filePath,originalName,mimetype}`; sem arquivo 400 `{error}`. O caminho retornado é absoluto no servidor. |
| Upload: arquivo Drive | `POST /uploads/gdrive` | Nenhuma | `{driveLinkOrId,fileName?}` → `{message,filePath,originalName}`; sem ID 400 e falha de acesso/download 500, ambos `{error}` (+ `details` em 500). |
| Upload: gerar e publicar | `POST /orchestrator/generate_and_upload` | Nenhuma | JSON: `generationType`, `generationSource`, `audioDir` ou `audioDirs[]`, `videoDir`/`imageDir` conforme fonte, `theme,email,channelId,channelType`, opcionais `channelLang,niche,musicGenre,platforms,isShortForm,forceStyle,refreshToken,outputName`. Sucesso 200 `{message,videoPath,videoId?,link?,results,generationDetails}`. Validação 400 `{error}`; falha 500 `{error,details}`. |
| Canais: salvar edição | `PATCH /youtube/channels/:channelId` | Nenhuma | Body inclui `email` e campos editáveis do canal; `email` é removido antes do update. Sucesso `{message,channel}`; ausência de email/ID 400, erro 500, ambos `{error}`. |
| Canais: renovar token | `POST /youtube/refresh-token` | Nenhuma | `{channelId,email}` → `{success,message,expiresAt}`; token expirado/revogado 401 `{error,needsReconnect:true}`; usuário/canal ausente 404. |
| Canais: iniciar OAuth YouTube | `GET /youtube/auth?email=…` | Nenhuma | No request Axios (JSON/XHR) → `{url}`; chamada normal do browser redireciona ao Google. Callback do Google é `GET /youtube/oauth2callback?code=…&state=…`, termina em HTML de sucesso/erro ou redireciona para consentimento do Drive. |
| Canais: iniciar OAuth Meta | `GET /meta/auth?email=…&channelId=…` | Nenhuma | Axios → `{url}`; navegação normal redireciona ao Meta. Callback `/meta/oauth2callback` termina em HTML, ou página com escolha se há várias páginas; seleção usa `/meta/select-page`. |
| Histórico: atualizar métricas | `POST /history/videos/refresh` | Nenhuma | `{email,videoId?}` → com `videoId`, `{video}`; sem ID, resultado de refresh `{updated,total,...}`. Erro 500 `{error}`. |
| Exclusão: pedir | `POST /data-deletion/request` | Nenhuma | `{email}` → 201 `{message,code,statusUrl}`. Para callback Meta, `signed_request` gera `{url,confirmation_code}`. Email ausente 400 `{message}`. |
| Exclusão: consultar | `GET /data-deletion/status/:code` | Código opaco, sem login | → `{email,status,requestedAt,completedAt?,code}`; código desconhecido 404 `{message}`. |

Referências de rota/handler: [routers](../../api/src/routers), [auth.controller.ts](../../api/src/controllers/auth.controller.ts), [GenerateAndUploadVideosController.ts](../../api/src/controllers/GenerateAndUploadVideosController.ts), [history.controller.ts](../../api/src/controllers/history.controller.ts), [data_deletion.controller.ts](../../api/src/controllers/data_deletion.controller.ts). O único middleware de credencial visto nos routers é `requireGladiadorYoutube`, aplicado a publicação/upload e comentários para JWT de agente e allowlist de canais; não está nos endpoints acima ([social_publisher.router.ts](../../api/src/routers/social_publisher.router.ts), [yt_upload_video.router.ts](../../api/src/routers/yt_upload_video.router.ts)).

## Estados que a interface implementa

| Tela | Loading | Empty / success | Error e comportamento importante |
|---|---|---|---|
| Login | Sem estado de envio; botão não desabilita. | Sucesso guarda `user/token` e navega para `/`. | Erro inline em texto; valida email localmente. Google usa o mesmo estado de erro. |
| Cadastro | Sem estado de envio; botão não desabilita. | Sucesso autentica e navega para `/`. | Erro inline; valida somente email no cliente. |
| Dashboard | Spinner de página para ambas as requisições em `Promise.all`. | Cards mostram zero quando não há dados; alerta de canal ausente se `channelCount===0`. | Sem `catch`/estado de erro: rejeição deixa dados iniciais e é engolida por `finally`; nenhum retry explícito. |
| Upload | `isLoading` desabilita submit e mostra spinner “Processando Geração...” ao enviar; carga inicial dos canais não tem indicador. | Mensagem de sucesso e resultados por plataforma (sucesso/falha/pulado). | Mensagem de erro também cobre validações. Falha ao carregar canais só vai ao console e vira lista vazia. Processo é síncrono para a tela até terminar geração/publicação. |
| Canais | Spinner substitui página na carga inicial/reload. Botões por operação têm loaders próprios. | Vazio “Nenhum canal autorizado…” com CTA vincular. Sucesso de salvar/token/OAuth em banner. | Banner de erro; renovar token com `needsReconnect` abre autorização Google e mostra orientação. OAuth abre janela popup; não há polling/retorno automático após concluir. |
| Histórico | Spinner de página ao carregar lista; botão stats tem loader. | Vazio “Nenhum vídeo publicado”; modos cards/lista; banner de sucesso depois do refresh. | Banner de erro; `fetchVideos` não limpa estado anterior. O refresh chama nova busca sem aguardar e usa resultado atualizado/total. |
| Tools | Nenhum. | Texto “Additional utilities will be available here.” | Sem erro ou integração. |
| Settings | Nenhum. | Tema selecionável light/dark; persistência em `localStorage`, preferência do sistema só é lida no primeiro default. | Não tem estados de erro; “System Sync” está marcado como futuro e visualmente desabilitado. |
| Termos | Nenhum. | Conteúdo estático. | Sem estados de rede. |
| Exclusão | Estado `loading` compartilhado entre solicitar/consultar, botões mostram “Enviando...”/“Consultando...”. | Solicitação mostra mensagem, código e URL; consulta mostra email/status/datas. Estados traduzidos incluem pending/processing/completed/not_found. | Um único erro para ambos os formulários; não há estado inicial de consulta além do form. Resposta do callback Facebook não é fluxo da tela. |

Referências de estados: páginas em [web/src/pages](../../web/src/pages); resumo de rotas e chamadas no cliente em [api.ts](../../web/src/lib/api.ts).

## Inconsistências e restrições para o redesign

- **Modo “Arquivos Separados” não fecha contrato.** A tela oferece `generationType='files'`, mas coleta um arquivo de áudio e envia `audioDir`; o controller exige array não vazio `audioDirs[]` nesse modo e retorna 400. Se a proposta mantiver esse modo, precisa pedir múltiplos arquivos e ajustar o payload no trabalho de implementação. Evidência: [Upload.tsx](../../web/src/pages/Upload.tsx#L82), [GenerateAndUploadVideosController.ts](../../api/src/controllers/GenerateAndUploadVideosController.ts#L56).
- **Estados de erro de Dashboard/Upload podem parecer “sem dados”.** Dashboard não apresenta erro de rede; Upload converte falha de canais em lista vazia, sem distinguir conta sem canais de API indisponível. Proposta deve reservar estados distintos para vazio e falha, mesmo que a correção de código fique para implementação.
- **Não há sessão reconhecida pela API geral.** O frontend não envia JWT de usuário e a maioria dos routers não verifica autenticação; os endpoints aceitam `email` como identificador. `ProtectedRoute` é só barreira cliente. O redesign não deve prometer privacidade/isolamento de dados como propriedade já garantida pelo backend; autenticação/autorização API exigiria escopo de implementação próprio.
- **Exclusão e texto legal divergem do processamento real.** A tela informa exclusão em até 7 dias, mas controller muda para `processing` e remove usuário/histórico via `setImmediate`, podendo resultar em `completed` ou `not_found`; a tela não mostra “processing” em tempo real sem consulta manual. Controller apaga `PublishedVideoModel` e `User`, mas canais ficam embutidos no user. A proposta deve preservar linguagem verificável e explicitar status consultável.
- **OAuth retorna HTML/popups, não callback SPA.** Conexão YouTube/Meta abre janela e comunica sucesso em página HTML; a tela atual não detecta conclusão nem recarrega canais automaticamente. Planejar CTA de recarregar/retorno manual ou mudança coordenada de contrato, sem desenhar callback in-app como comportamento existente.
- **Conteúdo da tela versus backend.** “Tools” não possui utilidades; “System Sync” não existe funcionalmente; Settings guarda só o tema local. Não apresentar esses itens como ações persistidas no servidor.
- **Textos e idioma são mistos.** Labels de login/cadastro/settings/tools aparecem em inglês, enquanto o restante é majoritariamente português; `channelLang` é pt no formulário, mas fallback do backend é en. Proposta pode padronizar a interface sem alterar os valores aceitos (`pt`/`en`).
- **Uploads devolvem caminhos internos.** A UI precisa manter os caminhos recebidos somente como dados de trabalho; o contrato retorna path absoluto do servidor, não URL pública. A tela não tem progresso granular por etapa; há um único loading durante uploads, geração e publicação.
- **Resultados por plataforma podem ser parciais.** HTTP 200 do orquestrador contém `results[]` com `success`, `skippedReason`, `error`, `url`; portanto sucesso HTTP não quer dizer publicação completa em todas plataformas. A UI já mostra cada resultado; manter estados parciais.

## Motion e dependências

React 19 e Tailwind CSS 4 já estão instalados. O pacote não inclui `motion`/`framer-motion`; animações existentes usam classes CSS/Tailwind (`transition-*`, `animate-spin` e `animate-in`), sem dependência declarada de plugin de animação. A proposta pode usar transições CSS e estados de classe com a stack atual. Para timelines/variants e transições de layout mais elaboradas, `motion` (Motion for React) seria uma dependência nova e viável tecnicamente, mas requer inclusão e revisão na fase de implementação; nada foi instalado. Respeitar `prefers-reduced-motion` e manter feedback de loading imediato, sem depender de animação para comunicar resultado. Fonte: [web/package.json](../../web/package.json), [index.css](../../web/src/index.css), [tailwind.config.js](../../web/tailwind.config.js).
