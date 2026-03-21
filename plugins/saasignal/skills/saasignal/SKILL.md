---
description: Operate the SaaSignal serverless infrastructure API — KV, Channels, Jobs, Storage, AI, Logistics, Delivery, Commerce, Booking, Messaging — via MCP, REST, SDK, or CLI
disable-model-invocation: true
---

# SaaSignal Agent Skill

Use this document when an agent needs to discover or operate SaaSignal without guessing.

## Operating rules
- SaaSignal is one platform exposed through REST, MCP, the `saasignal` npm package, and the `saasignal` CLI.
- `tools/list` is authoritative for what the active MCP credential can call right now, and generated MCP tool names follow the HTTP OpenAPI `operationId` values.
- `/skills/saasignal`, `/llms.txt` (index), `/llms-full.txt` (full reference), and `/api/openapi.json` describe the broader SaaSignal capability catalog, including scope-gated routes that may not appear in the current `tools/list` response.
- When a documented HTTP route is visible for the session, an agent can call it directly through MCP by its OpenAPI `operationId` without dropping to REST.
- New documented Hono routes become MCP tools automatically when they ship with `describeRoute(...)` metadata and a stable `operationId`.
- Generated MCP route tools proxy the real HTTP handlers, so validation, billing, auth, and side effects stay aligned with REST.

## Choose the right surface
| Goal | Preferred surface | Why |
| --- | --- | --- |
| Connect an agent quickly to the live SaaSignal surface | MCP | Best for conversational use of the documented HTTP API via generated `operationId` tools, plus legacy operational aliases. Start with `saasignal_surface_map` or `saasignal_skill`, then `tools/list`. |
| Create or manage orgs, projects, API keys, or browser tokens | MCP first when visible in `tools/list` | These control-plane capabilities live under `/core/*` and are directly callable through MCP when the session has the right auth context and scopes. REST and the SDK remain ergonomic alternatives for scripted workflows. |
| Write TypeScript or Bun/Node application code | npm package | Use the `saasignal` SDK namespaces (`core`, `infra`, `logistics`, `delivery`, `commerce`, `booking`, `messaging`, `meta`) instead of hand-rolling fetches. |
| Run terminal or operator workflows for exposed primitives | CLI | Use `npx saasignal auth login` for browser OAuth, then use CLI namespaces: kv, locks, sketches, channels, jobs, workflows, webhooks, storage, media, ai, search, matching, ranking, logistics, delivery, commerce, booking, messaging, billing, orgs, meta. |
| Explore the full product surface or scope-gated capabilities that are not currently visible in MCP | REST docs | Read `/skills/saasignal`, `/llms.txt` (index), `/llms-full.txt` (full reference), `/api/openapi.json`, and `/to-humans.md`, then compare that catalog with `tools/list` for the active credential. |

## Product map
- `Core`: organizations, projects, tokens, billing, browser tokens
- `Infra`: kv, locks, sketches, channels, jobs, workflows, webhooks, storage, media, ai, decisioning (search, ranking, matching)
- `Logistics`: geo, tracking, geofences, eta fences, routing, geocoding
- `Modules`: delivery, commerce, booking, messaging

## MCP coverage today
- Available through MCP: the documented HTTP API surface through generated tools named after each route's OpenAPI `operationId`, plus the legacy operational aliases (`kv_get`, `channel_publish`, `job_create`, and friends).
- Newly added Hono routes appear automatically in MCP when they include `describeRoute(...)` metadata and a stable `operationId`.
- Treat `tools/list` as the live source of truth for the current session because OAuth-scoped MCP sessions only expose the tools the user approved.
- The only explicit non-generated exceptions are the `/mcp` transport endpoint itself and undocumented routes without `describeRoute(...)` metadata.

## Immediate discovery examples
- Tokens: `createToken` creates a scoped API key and `createBrowserToken` exchanges an existing API credential for a short-lived browser token. If they are not visible in `tools/list`, inspect `/skills/saasignal` or `/api/openapi.json` and reconnect with the required scopes.
- Search: `searchCreateIndex` creates a managed search index and `searchQueryIndex` runs lexical, semantic, or hybrid retrieval. These routes usually require `search:write` or `search:read` before they appear in `tools/list`.
- Delivery: `deliveryOrderCreate`, `deliveryDriverList`, and `deliveryDispatchSuggest` cover order creation, driver discovery, and dispatch suggestions. They may stay hidden until the session has delivery scopes and a project context.
- Commerce: `commerceProductCreate`, `commerceCartCheckout`, and `commerceOrderList` manage catalogs, carts, and orders. They may stay hidden until the session has commerce scopes.
- Booking: `bookingResourceCreate`, `bookingSlotsGet`, and `bookingBookingCreate` handle resources, availability, and reservations. They may stay hidden until the session has booking scopes.
- Messaging: `messagingConversationCreate`, `messagingMessageSend`, and `messagingParticipantAdd` manage conversations and messages. They may stay hidden until the session has messaging scopes.
- Example prompts: "Create a scoped access token for project proj_123 with kv:read only.", "Query the support-docs search index for refund policy hits.", "Suggest the best nearby drivers for order ord_123.", "Create a product and add it to a cart.", "Book a 60-minute slot for tomorrow.", "Send a message to the support conversation."

## Discovery workflow
1. Identify the user's goal: control-plane setup, infra primitive, logistics, delivery, commerce, booking, messaging, or docs/discovery.
2. Identify the execution surface: MCP for supported live primitives, REST for the full API, SDK for TypeScript integration, CLI for shell workflows.
3. Determine context requirements early: `org_id`, `project_id`, credential type, and required scope.
4. If using MCP, call `tools/list` before planning writes. If using REST, inspect `/api/openapi.json` or `/llms-full.txt` before assuming route names. Compare both when a capability seems missing.
5. On `403 insufficient_scope`, narrow the requested action or ask for a credential with the matching scope instead of retrying blindly.

## Common goal-to-surface playbook
- Need to set up an organization, create a project, or mint an API key: use MCP first when the route is visible in `tools/list`; use REST or the SDK when you need a scripted or batched workflow.
- Need to read or write KV, publish channels, inspect presence/history, manage jobs, or hit most documented routes interactively from an agent: use MCP first.
- Need raw SDK integration, direct file uploads, or a non-conversational batch workflow: REST or the SDK may still be a better fit even though the route is also reachable through MCP.
- Need docs for another agent or coding assistant: share `https://api.saasignal.saastemly.com/skills/saasignal` first, then `https://api.saasignal.saastemly.com/llms-full.txt` and `https://api.saasignal.saastemly.com/api/openapi.json` as deeper references.

## Credential and scope guide
- `mcp_at_...`: OAuth access token for `/mcp` only.
- `api_at_...`: OAuth access token for the regular HTTP API.
- `sk_live_...`: project API key for server-to-server HTTP calls and manual MCP fallback.
- `bt_...`: short-lived browser token for browser JavaScript against the HTTP API.
- `pt_...`: portal token used by the SaaSignal frontend/dashboard for control-plane flows.
- Common scopes: `orgs:*`, `projects:*`, `tokens:*`, `billing:read`, `kv:read`, `kv:write`, `channels:publish`, `channels:subscribe`, `jobs:read`, `jobs:write`, `workflows:*`, `webhooks:*`, `media:*`, `logistics:*`, `delivery:*`, `commerce:*`, `booking:*`, `messaging:*`.
- Use the smallest scope set that satisfies the task. The wildcard `*` is powerful and should be reserved for broad operator/admin flows.

## Protocol-specific starting points
- REST: `https://api.saasignal.saastemly.com/api/openapi.json`, `https://api.saasignal.saastemly.com/llms.txt` (index), `https://api.saasignal.saastemly.com/llms-full.txt` (full reference), `https://api.saasignal.saastemly.com/to-humans.md`
- MCP: `https://api.saasignal.saastemly.com/mcp` with OAuth discovery at `https://api.saasignal.saastemly.com/.well-known/oauth-protected-resource/mcp`
- SDK: `npm install saasignal` then `createClient(process.env.SAASIGNAL_KEY!)`
- CLI: `npx saasignal auth login` then commands like `npx saasignal kv get my-key`, `npx saasignal jobs list`, `npx saasignal commerce products list`, or `npx saasignal booking resources list`

## Hard rules for agents
- Never invent a primitive count or assume `tools/list` shows the full platform. Verify both the live MCP surface and the broader docs when needed.
- Never assume MCP parity with undocumented REST routes. Documented routes with stable `operationId` values are the contract for generated MCP tools.
- Prefer SaaSignal's native namespaces and route names over custom wrappers so the user's docs and SDK examples stay aligned.
- When a task spans multiple surfaces, keep the mental model consistent: the same project and scopes govern REST, SDK, CLI, and MCP usage.
- If you only have the SaaSignal MCP URL, call `saasignal_surface_map` or `saasignal_skill` first, then `tools/list` to see the generated `operationId` tool names that are live for the current session.

## Human setup references
- Frontend docs: `https://saasignal.saastemly.com/docs/mcp` and `https://saasignal.saastemly.com/docs/meta`
- API root landing page: `https://api.saasignal.saastemly.com`