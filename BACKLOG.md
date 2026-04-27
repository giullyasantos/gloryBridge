# GloryBridge — Backlog

> Legenda de status: `[ ]` Pendente · `[~]` Em progresso · `[x]` Concluído

---

## ÉPICO 1 — Fundação e Setup

**Objetivo:** O app roda localmente, dependências instaladas, ambiente pronto para desenvolvimento e contribuição.

### E1-S1 — Instalar dependências e rodar em modo dev
- [x] `npm install` sem erros
- [x] `npm run dev` abre janela Electron
- [x] Backend Express inicia na porta 3001
- [x] Banco JSON é criado com seed (músicas, escrituras, plano de exemplo)
- [x] Janela de apresentação abre junto com a janela do operador

### E1-S2 — Organizar estratégia de branches no git
- [x] Branch `main` recebe apenas código estável
- [x] Branch `dev` para integração
- [x] Convenção de branches: `feature/E{n}-S{n}-descricao`
- [x] Convenção de commits: `feat(E1-S2): descrição`
- [x] Documentar fluxo no README

### E1-S3 — Criar README com instruções de setup
- [x] Pré-requisitos (Node 18+, npm)
- [x] Como instalar e rodar
- [x] Como rodar o build
- [x] Screenshot do app (pendente — sem display no ambiente CI)

---

## ÉPICO 2 — Gestão de Músicas

**Objetivo:** Operador cria, edita, estiliza e organiza músicas com slides prontos para apresentação.

### E2-S1 — Criar e listar músicas na biblioteca
- [x] Botão "New Song" abre SongCreatorModal
- [x] Campos: título, artista, idioma
- [x] Salvar via `POST /api/v1/songs`
- [x] Música aparece na lista após salvar
- [x] Busca por nome funcional (Enter busca, X limpa e reseta lista)
- [x] Ícone de editar corrigido (Play → Pencil)
- [x] Delete com confirmação antes de remover
- [x] `addItem` corrigido para não atualizar estado de plan errado

### E2-S2 — Editor de slides com seções (Verse, Chorus, Bridge…)
- [x] Adicionar seção com tipo (Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro)
- [x] Editar texto de cada slide
- [x] Reordenar slides dentro do modal (DnD com @dnd-kit)
- [x] Remover slide
- [x] Persistir slides via API
- [x] Label auto-gerada ao trocar tipo (contagem correta de slides existentes)

### E2-S3 — Customizar estilo visual da música
- [x] Cor de fundo e cor da fonte (color picker)
- [x] Família e tamanho da fonte
- [x] Alinhamento do texto (esquerda, centro, direita)
- [x] Peso da fonte e sombra de texto
- [x] Cor da sombra (shadow color picker, visível apenas com shadow ativo)
- [x] Letter spacing slider
- [x] Preview em tempo real na aba Preview

### E2-S4 — Imagem de fundo na música
- [ ] Botão "Choose Background Image" na aba Style
- [ ] Selecionar arquivo local via `dialog` do Electron
- [ ] Exibir thumbnail no preview do modal
- [ ] Refletir imagem no PresentationWindow

### E2-S5 — Tradução automática de música com IA
- [ ] Botões ES / PT no SongCreatorModal
- [ ] Chamar `POST /api/v1/ai/translate` com slides da música
- [ ] Salvar tradução vinculada à música
- [ ] Música aparece com badge dos idiomas disponíveis

### E2-S6 — Editar e deletar músicas existentes
- [ ] Botão editar abre modal preenchido com dados da música
- [ ] Salvar alterações via `PUT /api/v1/songs/:id`
- [ ] Botão deletar com confirmação
- [ ] Lista atualizada após deleção

---

## ÉPICO 3 — Escrituras

**Objetivo:** Operador busca versículos bíblicos por referência ou tema e adiciona ao serviço.

### E3-S1 — Integrar com API externa da Bíblia
- [ ] Escolher API (bible-api.com ou api.bible — gratuita)
- [ ] Implementar busca por referência (ex: João 3:16) no backend
- [ ] Retornar texto real do versículo
- [ ] Remover mock de resultado offline

### E3-S2 — Busca por palavra-chave
- [ ] Campo de busca envia keyword para API externa
- [ ] Listar resultados com referência + trecho do texto
- [ ] Versículos populares (John 3:16, Salmo 23…) como atalhos

### E3-S3 — Seletor de versão da Bíblia
- [ ] Dropdown com versões: NIV, ESV, NVI (pt), ARA (pt)
- [ ] Mapear versões para IDs da API escolhida
- [ ] Lembrar última versão selecionada

### E3-S4 — Salvar versículos favoritos na biblioteca
- [ ] Botão "Salvar" em cada resultado
- [ ] Persistir via `POST /api/v1/scriptures`
- [ ] Tab "Saved" lista versículos salvos
- [ ] Remover versículo salvo

### E3-S5 — Adicionar versículo ao plano de serviço
- [ ] Botão "+" no card do versículo
- [ ] Adicionar via `POST /api/v1/services/:id/items`
- [ ] Toast de confirmação
- [ ] Item aparece no ServicePlanner

---

## ÉPICO 4 — Biblioteca de Mídia

**Objetivo:** Operador faz upload de imagens e vídeos para usar como fundo de slides ou itens do serviço.

### E4-S1 — Upload de imagens
- [ ] Botão "Upload" abre diálogo de arquivo nativo (Electron dialog)
- [ ] Copiar arquivo para pasta `userData/glorybridge/media/`
- [ ] Implementar `POST /api/v1/media/upload` com multer
- [ ] Registrar no banco JSON com título, path, tipo
- [ ] Exibir na grid com thumbnail

### E4-S2 — Visualizar e gerenciar imagens
- [ ] Grid de thumbnails com nome do arquivo
- [ ] Hover mostra botões: Usar como fundo / Adicionar ao serviço / Deletar
- [ ] Deletar remove arquivo do disco e do banco

### E4-S3 — Upload e exibição de vídeos
- [ ] Upload de arquivos `.mp4`, `.webm`, `.mov`
- [ ] Thumbnail gerado do primeiro frame
- [ ] PresentationWindow exibe vídeo com autoplay + loop

### E4-S4 — Usar mídia como fundo de slide de música
- [ ] No SongCreatorModal > Style, botão "Escolher da Biblioteca"
- [ ] Abre seletor das imagens já enviadas
- [ ] Aplica como backgroundImage do estilo

---

## ÉPICO 5 — Experiência de Apresentação

**Objetivo:** Apresentação fluida durante o culto com navegação por teclado e preview para o operador.

### E5-S1 — Atalhos de teclado para o operador
- [ ] `→` ou `Space` — próximo slide
- [ ] `←` — slide anterior
- [ ] `↑` — próximo item do serviço
- [ ] `↓` — item anterior
- [ ] `B` — toggle blank (tela preta)
- [ ] `L` — toggle logo
- [ ] Registrar atalhos no OperatorWindow (sem conflito com inputs)

### E5-S2 — Preview do próximo slide no painel do operador
- [ ] Área "Next" no PresentationControls mostra o próximo slide
- [ ] Atualiza em tempo real conforme navegação
- [ ] Mostra tipo do próximo item (música, escritura, mídia)

### E5-S3 — Contador de slides e progresso
- [ ] Indicador "Slide X de Y" visível no painel do operador
- [ ] Barra de progresso do item atual
- [ ] Indicador de qual item está ao vivo no ServicePlanner

### E5-S4 — Modo bilíngue na apresentação
- [ ] Toggle para exibir idioma principal + secundário simultaneamente
- [ ] Layout dois idiomas (primário em cima, tradução embaixo)
- [ ] Verificar que funciona com músicas que têm tradução cadastrada

---

## ÉPICO 6 — Configurações e Integração com IA

**Objetivo:** App configurado com chave da API Claude, idioma padrão e monitor correto.

### E6-S1 — Configurar monitor de saída
- [ ] Listar monitores conectados via `display.getMonitors()`
- [ ] Salvar índice do monitor escolhido nas settings
- [ ] Aplicar na próxima abertura: janela de apresentação abre no monitor configurado
- [ ] Botão "Refresh" atualiza lista sem reiniciar o app

### E6-S2 — Configurar e validar chave da API Claude
- [ ] Campo de API key no Settings (mascarado)
- [ ] Botão "Test Key" valida a chave com chamada real à API
- [ ] Mostrar badge "Connected" ou "Invalid Key"
- [ ] Salvar key criptografada no arquivo de settings

### E6-S3 — Idioma padrão da apresentação
- [ ] Dropdown: Inglês / Espanhol / Português
- [ ] Aplicar como idioma selecionado ao iniciar Go Live
- [ ] Idioma de fallback quando tradução não disponível

### E6-S4 — Geração de música com IA
- [ ] Campo de prompt: "Música sobre graça divina, estilo contemporâneo"
- [ ] Chamar `POST /api/v1/ai/create-song`
- [ ] Abrir SongCreatorModal preenchido com resultado
- [ ] Operador revisa e salva

---

## ÉPICO 7 — Planos de Serviço

**Objetivo:** Operador organiza múltiplos planos de serviço e gerencia o fluxo completo do culto.

### E7-S1 — Criar e nomear planos de serviço
- [ ] Botão "Novo Plano" com modal: nome + data
- [ ] Salvar via `POST /api/v1/services`
- [ ] Plano aparece na lista do ServicePlanner

### E7-S2 — Selecionar e alternar entre planos
- [ ] Dropdown ou lista de planos criados
- [ ] Ao selecionar, carrega itens do plano
- [ ] Indicar qual plano está ativo

### E7-S3 — Deletar e duplicar planos
- [ ] Botão deletar com confirmação
- [ ] Botão duplicar (copia estrutura do plano com todos os itens)
- [ ] Útil para cultos recorrentes com estrutura parecida

### E7-S4 — Adicionar itens ao serviço por drag-drop da biblioteca
- [ ] Arrastar música da MediaLibrary para o ServicePlanner
- [ ] Arrastar versículo do ScriptureSearch para o ServicePlanner
- [ ] Manter ordem após soltar

---

## ÉPICO 8 — Distribuição

**Objetivo:** App empacotado e instalável em Mac e Windows sem precisar de Node.js.

### E8-S1 — Build macOS (.dmg)
- [ ] `npm run build:mac` gera `.dmg` e `.app`
- [ ] App abre corretamente após instalação
- [ ] Servidor Express embutido inicia junto com o app
- [ ] Janelas abrem no monitor correto

### E8-S2 — Build Windows (.exe)
- [ ] `npm run build:win` gera instalador NSIS
- [ ] Testar em Windows 10/11
- [ ] Paths de arquivo compatíveis com Windows

### E8-S3 — Auto-update (futuro)
- [ ] Electron Updater configurado
- [ ] Canal de releases no GitHub
- [ ] Notificação in-app quando nova versão disponível

---

## Ordem de prioridade sugerida

| Prioridade | Épico | Motivo |
|------------|-------|--------|
| 1 | E1 — Fundação | Pré-requisito para tudo |
| 2 | E2 — Músicas | Core do produto |
| 3 | E5 — Apresentação | Experiência ao vivo |
| 4 | E3 — Escrituras | Segundo tipo de conteúdo mais usado |
| 5 | E6 — Configurações | Habilita IA e monitor correto |
| 6 | E7 — Planos | Fluxo completo de gestão |
| 7 | E4 — Mídia | Enriquecimento visual |
| 8 | E8 — Distribuição | Entrega final |
