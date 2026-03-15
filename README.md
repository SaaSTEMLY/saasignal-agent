# saasignal-agent

SaaSignal agent skill, Claude Code plugin, and skills.sh package.

## Install

### skills.sh

```sh
npx skills add saastemly/saasignal-agent
```

### Claude Code Plugin

```
/plugin marketplace add saastemly/saasignal-agent
/plugin install saasignal@saasignal
```

This gives you:

- `/saasignal` skill command in Claude Code
- Auto-configured MCP server pointing to `https://api.saasignal.saastemly.com/mcp`

## What's inside

- **SKILL.md** — Agent playbook: when to use MCP vs REST vs SDK vs CLI, MCP coverage, scope boundaries, discovery workflow
- **references/llms-full.txt** — Snapshot of the full LLM-optimized API reference
- **plugins/saasignal/** — Claude Code plugin with MCP server configuration

## Content sync

Content is automatically synced from the live SaaSignal API weekly via GitHub Actions. You can also trigger a manual sync:

```sh
bun run saasignal-agent/scripts/sync.ts
```

## Links

- [SaaSignal](https://saasignal.saastemly.com)
- [API docs](https://api.saasignal.saastemly.com)
- [llms.txt](https://api.saasignal.saastemly.com/llms.txt)
- [Full API reference](https://api.saasignal.saastemly.com/llms-full.txt)
- [MCP endpoint](https://api.saasignal.saastemly.com/mcp)
