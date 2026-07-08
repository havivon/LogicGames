# Claude Code Skills

Project-level skills, loaded automatically in every Claude Code session on this repo.
Invoke explicitly with `/<skill-name>`, or let Claude trigger them automatically when a
request matches the skill's description.

| Skill | What it does | Source |
|---|---|---|
| `frontend-design` | Distinctive, intentional visual design for new or reworked UI | [anthropics/skills](https://github.com/anthropics/skills) |
| `grill-with-docs` | Relentless interview to sharpen a plan/design, writing ADRs + glossary as you go | [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) |
| `grilling` | Dependency of `grill-with-docs`: the interview loop itself | [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) |
| `domain-modeling` | Dependency of `grill-with-docs`: maintains CONTEXT.md + ADRs | [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) |
| `tdd-workflow` | Enforces test-driven development (red → green → refactor, 80%+ coverage) | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (MIT) |
| `code-reviewer` | Senior-level review of recent changes: quality, security, maintainability | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (MIT), adapted from agent to skill |
| `skill-creator` | Create, improve, and eval new skills | [anthropics/skills](https://github.com/anthropics/skills) |

Vendored on 2026-07-08. To update a skill, re-copy it from its source repo.
