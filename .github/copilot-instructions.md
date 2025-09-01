# Copilot Instructions f## Integration Points
- **Client/Server Communication**: API requests are sent from client hooks/components to server endpoints, which delegate to the appropriate service(s).
- **Cross-Service Orchestration**: `IntegrationService` routes requests based on message analysis (e.g., image prompt triggers image generation, knowledge query triggers KB lookup). Always tries knowledge base first if documents are available.
- **Shared Types**: Always import types from `shared/schema.ts` for request/response consistency.
- **Document Processing**: Files are parsed based on MIME type - text files read directly, PDFs parsed with `pdf-parse`, Word docs with `mammoth.js`.
- **Knowledge Base Priority**: When knowledge base is enabled and has documents, queries are first checked against uploaded content before falling back to general chat.penai-node

## Big Picture Architecture
- The project is a full-stack POC integrating OpenAI features (chat, knowledge base, image/audio generation, moderation) via a modular service architecture.
- **Server-side** (`server/`): Organized by week/features. Each service (e.g., `chatService.ts`, `imageService.ts`, `audioService.ts`, `moderationService.ts`, `knowledgeBaseService.ts`) exposes async methods for its domain. The `IntegrationService` (`week4/integrationService.ts`) orchestrates all features, providing a unified API.
- **Client-side** (`client/`): React + Vite app. UI components are grouped by domain (`chat/`, `ui/`). Hooks in `hooks/` encapsulate feature logic (e.g., `useChat.ts`, `useOpenAI.ts`).
- **Shared types**: `shared/schema.ts` defines TypeScript types/interfaces for requests, responses, and feature flags, used across client/server.
- **Document Processing**: Supports .txt, .pdf, and .docx files with automatic text extraction using `pdf-parse` and `mammoth` libraries.

## Developer Workflows
- **Development**: Use `npm run dev` (ensure cross-platform env vars; use `cross-env` for NODE_ENV).
- **Build**: `npm run build` builds both client (Vite) and server (esbuild). Output is in `dist/`.
- **Start (Production)**: `npm run start` runs the bundled server from `dist/index.js`.
- **Database**: Drizzle ORM is used. Use `npm run db:push` to apply schema changes.
- **Type Checking**: `npm run check` runs TypeScript.

## Project-Specific Patterns
- **Feature Flags**: Session-based feature toggling is managed in `IntegrationService` via `configureSessionFeatures` and `getSessionFeatures`.
- **Unified Response**: All API responses from `IntegrationService` follow the `IntegratedChatResponse` type, including chat, image, audio, moderation, and error fields.
- **Error Handling**: Errors are caught and returned in the response object, not thrown.
- **Session Statistics**: Usage stats are tracked per session in-memory (`sessionStatistics` map).
- **Service Boundaries**: Each service is responsible for its own domain logic/history (e.g., `chatService.clearChatHistory`).
- **External APIs**: OpenAI API is used via the `openai` npm package. Credentials/config in `server/config/openai.ts`.

## Integration Points
- **Client/Server Communication**: API requests are sent from client hooks/components to server endpoints, which delegate to the appropriate service(s).
- **Cross-Service Orchestration**: `IntegrationService` routes requests based on message analysis (e.g., image prompt triggers image generation, knowledge query triggers KB lookup).
- **Shared Types**: Always import types from `shared/schema.ts` for request/response consistency.

## Conventions & Examples
- **TypeScript everywhere**; use explicit types for all service methods and responses.
- **Async/await** for all service calls; never mix with callbacks.
- **Feature toggles**: Example usage in `IntegrationService`:
  ```ts
  if (features.imageGeneration) { /* ... */ }
  ```
- **Document upload handling**: Example:
  ```ts
  const result = await api.uploadDocument(file);
  if (result.success) { /* show success toast */ }
  ```
- **Knowledge base priority**: KB queries are attempted first if documents exist:
  ```ts
  if (kbStats.documentCount > 0 && kbResponse.hasContext) {
    // Use KB result
  } else {
    // Fall back to general chat
  }
  ```
- **Error response**: Example:
  ```ts
  return {
    sessionId,
    timestamp: new Date(),
    features: this.getSessionFeatures(sessionId),
    chat: { /* ... */ },
    error: error instanceof Error ? error.message : "Unknown error",
  };
  ```

## Key Files
- `server/services/week4/integrationService.ts`: Main orchestrator, entry point for unified API.
- `client/src/hooks/`: Feature-specific hooks for client logic.
- `shared/schema.ts`: Types/interfaces for all requests/responses.
- `server/config/openai.ts`: OpenAI API config.

---

If any section is unclear or missing important details, please specify what needs improvement or what workflows you want documented further.
