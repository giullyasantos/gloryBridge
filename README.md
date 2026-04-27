# GloryBridge

App desktop para igrejas controlarem apresentações durante cultos — músicas, escrituras e mídias exibidas em projetores, com suporte bilíngue e IA integrada.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm 9 ou superior

## Instalação

```bash
npm install
```

## Rodar em modo dev

```bash
npm run dev
```

Abre duas janelas:
- **Janela do Operador** — controle de slides, plano de serviço, biblioteca
- **Janela de Apresentação** — saída full-screen para o projetor (monitor externo)

O servidor Express inicia automaticamente na porta `3001`.

## Build

```bash
# macOS
npm run package

# ou só o build sem empacotar
npm run build
```

## Estrutura do projeto

```
electron/
  main/       # Main process (ciclo de vida, IPC, state machine)
  preload/    # Context bridge renderer ↔ main
  server/     # Backend Express (API REST + banco JSON)
    routes/   # songs, scriptures, services, media, settings, ai
src/
  renderer/   # Frontend React
    components/
    store/    # Zustand stores
    windows/  # OperatorWindow, PresentationWindow
    types/    # Interfaces TypeScript
```

## Fluxo de branches

```
main   ←── PR final (deploy)
  └── dev  ←── integração de todas as features
        └── feature/E{n}-S{n}-descricao
```

Todo desenvolvimento vai para `dev`. Merge em `main` somente ao concluir todos os épicos.
