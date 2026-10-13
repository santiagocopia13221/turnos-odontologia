# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

> Project: `turnos-odontologia` (Node.js API HTTP + in-memory DB + node:test; dominio: turnos odontológicos).
> No `state.skills.installed` skills (the user chose to install none of the recommended ones), and no project-level skills dirs exist. The skills below are the user-level (global) skills found in `~/.config/opencode/skills/`.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| /active-orchestrator:init, /active-orchestrator:kb, /active-orchestrator:rules, /active-orchestrator:discovery, /active-orchestrator:openspec, /active-orchestrator:devops, /active-orchestrator:find-skill — or start a new project with the SDD/OpenSpec foundation flow | active-orchestrator | C:\Users\Santiago\.config\opencode\skills\active-orchestrator\SKILL.md |
| Create/generate/update AGENTS.md or CLAUDE.md, "armar las reglas del proyecto", "instrucciones para los agentes", after kb-creator + roadmap-generator | agents-md-generator | C:\Users\Santiago\.config\opencode\skills\agent-instruction\SKILL.md |
| Run the Discovery/research phase before the KB; investigate market/think about what to build while uncertain | discovery-research | C:\Users\Santiago\.config\opencode\skills\discovery-research\SKILL.md |
| "how do I do X", "find a skill for X", "is there a skill that can…", wants to extend agent capabilities | find-skills | C:\Users\Santiago\.config\opencode\skills\find-skill\SKILL.md |
| Create/build/generate a project knowledge base; document a project from source docs (.txt/.docx/.pdf); "armar base de conocimiento" / "crear KB" | kb-creator | C:\Users\Santiago\.config\opencode\skills\kb-creator\SKILL.md |
| Create/build/regenerate CHANGES.md, roadmap, change map, implementation plan; "armar CHANGES", "armar roadmap", "qué changes necesito" | roadmap-generator | C:\Users\Santiago\.config\opencode\skills\roadmap-generator\SKILL.md |
| Create/modify/optimize a skill from scratch; run evals/benchmarks for a skill; optimize a skill's description for triggering | skill-creator | C:\Users\Santiago\.config\opencode\skills\skill-creator\SKILL.md |
| Investigate/scrape a competitor from a URL; invoked by discovery-research during Discovery | web-scraper | C:\Users\Santiago\.config\opencode\skills\web-scraper\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### active-orchestrator
- Thin orchestrator only: detect entrypoint, manage the shared state file, run `openspec init`, dispatch phases, hold checkpoints.
- Phase order (§4.2): discovery-research → kb-creator → roadmap-generator → find-skill → skill-registry → agent-instruction.
- NEVER reimplement a phase's logic; route to its sub-skill (`Skill` for interactive, `Agent` for mechanical).
- NEVER ask strategic content questions (system_type, scale, stack, problem, 11-point checklist) — those belong to kb-creator/discovery-research.
- Own `step` only: write just `version`/`step`/`owner` to state; sub-skills write their own sections.
- Check sub-skill presence before dispatch; if missing → offer install → degrade if declined.
- NEVER install anything autonomously: find-skill recommends, the user picks, only then install.
- STOP and wait after each AskUserQuestion; never assume the answer.
- NEVER chain phases without a checkpoint; require an explicit "Continuar" to advance `step`.
- Resume by default when a state file exists with `step != "done"`.

### agents-md-generator
- Generate `AGENTS.md` + `CLAUDE.md` (identical copies) at the project ROOT; never inside `.claude/` or `openspec/`.
- Pre-checks: `knowledge-base/` + `02_descripcion_general.md` must exist; `CHANGES.md` optional (omit the Roadmap section and warn if absent).
- Read: KB `02` (stack), KB `README` (name/summary), `CHANGES.md` (roadmap summary), KB `10` (open questions).
- Source of truth for available skills = `.atl/skill-registry.md` (read it, do NOT re-scan). Fallback: scan skills dirs.
- Read the global `~/.claude/CLAUDE.md` to NOT duplicate its universal rules — emit only project-specific + uncovered-universal rules.
- Hard rules are the ONLY interactive part; stack-aware; confirm with the user before writing; never invent unconfirmed rules.
- Never hardcode rules to a language; derive candidates from the real stack.
- Do NOT copy compact rules into AGENTS.md — only map skill→role and reference `.atl/skill-registry.md`.
- First-level sections are contract: Stack, KB, Skills, Roadmap, Hard Rules, Workflow.

### discovery-research
- Runs the Discovery phase BEFORE the KB; its output feeds kb-creator, it does not replace it.
- Core rule: never fill a checklist point with an assumption when you can ask or research it.
- Phase 1: ask (single question) for concrete sources; if URLs, invoke web-scraper once per URL; no sources → continue anyway, never block on URLs.
- Phase 2: 11-point Q&A via `references/checklist.md`; 3-5 questions/round with a/b/c options and "why it matters"; do not re-ask what scraping already covered.
- Risks/open questions: apply assumption-mapping — unproven assumptions become risks and open questions.
- Phase 3 (gate): show the 11-point summary + assumptions and wait for explicit confirmation BEFORE writing any file.
- Phase 4: write `discovery/discovery.md` (prose) and update ONLY `state.discovery` (see `references/state-contract.md`).
- Governance MEDIO: checkpoints + expose non-obvious decisions.
- Not self-contained: depends on web-scraper for URLs; if unavailable, continue with pure Q&A and warn.

### find-skills
- Use when the user asks "how do I do X", "find a skill for X", or wants to extend capabilities.
- Check the skills.sh leaderboard first before running a CLI search.
- Search with `npx skills find [query] [--owner <owner>]`.
- Verify quality before recommending: prefer 1K+ installs, official sources (vercel-labs, anthropics, microsoft), repos with >100 stars; be skeptical below 100.
- Present: name + what it does, install count + source, the install command, and a skills.sh link.
- Install only after the user agrees: `npx skills add <owner/repo@skill> -g -y`.
- If nothing is found: say so, offer to help directly, and suggest `npx skills init`.

### kb-creator
- Build `knowledge-base/` with the 10 canonical `.md` files (+ `README.md` index) at the PROJECT ROOT; never mix with `docs/`.
- Mode A (silent/ingest): `docs/` has source files → read all, generate the KB with NO questions; ambiguity → log in `10_preguntas_abiertas.md`, never invent.
- Mode B (interactive): no `docs/` → act as senior architect + PM; 3-5 strategic questions; wait for answers; iterate file by file.
- Canonical 10: 01 vision, 02 descripción general (stack), 03 actores/roles, 04 modelo de datos, 05 reglas de negocio (RN-XX), 06 funcionalidades, 07 flujos, 08 arquitectura, 09 decisiones/supuestos, 10 preguntas abiertas.
- Optional extras allowed with `1X_`/`2X_` prefix; they never replace the 10 canonical.
- Don't run if `knowledge-base/` already has the 10 canonical complete.
- If orchestrated (state file exists): write ONLY `state.kb`; source = `"ingest"` (A) / `"interactive"` (B); mixed run → dominant origin wins.
- If a top-level `discovery` section exists, read it to pre-fill fields (don't re-ask) — see state-contract §5.

### roadmap-generator
- Generate ONE file: `CHANGES.md` at the project ROOT (never inside `openspec/`).
- Pre-checks: `knowledge-base/` exists + has the 10 canonical + `openspec/` exists; else abort with a clear message.
- Fire-and-forget: no questions.
- Always read: KB `04` (modelo de datos), `06` (funcionalidades), `07` (flujos), `08` (arquitectura); optionally `03`/`05`/`10`.
- If orchestrated: use `state.kb.files` as the authoritative path list; `state.kb.discovery` as a naming/governance hint only (files are truth).
- Codes `C-NN` (2-digit pad), kebab-case names, no `us-NNN-` prefix; transversal infra still gets a `C-NN`.
- Dependencies: infra first (C-01), core models before features, auth before protected, referenced entity before referrer, backend before coupled frontend, integrations last, admin/dashboards last, UI restyle last.
- Section structure is contract (do not add/remove): dependency tree, parallelism gates, critical path, 3-agent plan, per-phase changes with Estado/Scope/Dependencias/Governance/Leer antes.
- Scope bullets must be operational (endpoints, migrations, models, events, tests) — not descriptive.
- Governance levels BAJO/MEDIO/ALTO/CRITICO with defined criteria.
- If orchestrated: write ONLY `state.roadmap` (`created_by`, `source: "CHANGES.md"`, list of C-NN); never touch `step`.

### skill-creator
- Use to create/edit/optimize skills, run evals, benchmark performance, or optimize a skill's description for triggering.
- Loop: capture intent → draft → write test prompts → evaluate (qualitative + quantitative) → rewrite → repeat.
- Capture intent: what it enables, when it triggers, expected output format, and whether test cases are warranted (objective vs subjective outputs).
- Interview and research proactively (edge cases, I/O formats, examples, success criteria); check MCPs; use subagents in parallel for research when available.
- Figure out where the user is in the process and jump in; stay flexible (skip evals if the user declines).
- After the skill is done, run the description improver to optimize triggering.
- Adjust jargon to the user's apparent familiarity; define terms when unsure.

### web-scraper
- Turns a competitor/existing-solution URL into a structured markdown note; the output schema is FIXED (always 8 fields, same order).
- Read-only external skill: no approval gate for a single URL; process multiple URLs one-by-one and report resolved vs failed — do not abort the batch on one failure.
- Phase 1: take URL(s), add scheme if missing; ask for a more specific URL only if obviously not home/product/pricing; don't block on minor doubts.
- Phase 2: `WebFetch` with a prompt requesting the 8 fixed-schema fields (`references/output-schema.md`); a missing field → `(no publicado)`; never invent.
- On empty/SPA-shell/blocked content (403, paywall, CAPTCHA): report the limitation, do NOT attempt evasion, and continue with the next URL.
- Phase 3: filename via `scripts/slugify.py` (kebab-case from competitor/domain) → write to `discovery/sources/<slug>.md` (create the dir); repeated runs overwrite the same file.
- Never invent data the page doesn't show; never crawl/mass-scrape a whole site.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| (none found) | — | No `AGENTS.md` / `CLAUDE.md` / `.cursorrules` / `GEMINI.md` / `copilot-instructions.md` at the project root yet. Phase 5 (`agents-md-generator`) will generate `AGENTS.md`/`CLAUDE.md` later. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
