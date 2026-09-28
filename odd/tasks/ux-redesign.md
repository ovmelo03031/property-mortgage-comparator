# UX/UI redesign

## Objective
Implement the Claude Design canvas "Comparador hipotecario · Rediseño UX/UI"
(https://claude.ai/artifact/Szpg59RCcLvjRCXy6xg47H) in `index.html`.

## Problem / why
~30 inputs before any result, 14 stacked sections repeating Principal vs Negociado,
jargon, mixed ES/EN copy, silent clamping, overloaded sticky bar, wide tables on
mobile, color-only signals, only a global reset, dark theme only.

## Scope
- Presentation layer of `index.html` only (HTML templates, CSS, render functions, UI state).
- Design source: canvas `.dc.html` artboards (downloaded to the session scratchpad, not committed).

## Constraints
- The `/* CALC:START */ … /* CALC:END */` block (and any block read by `tests/check.js`) stays byte-identical.
- Single static `index.html`, no framework, no build (GitHub Pages).
- No data leaves the device; localStorage persistence kept (URL-hash share optional).
- Every existing feature/output kept (see inventory in canvas artboard 2).
- UI copy in Spanish, consistent with the canvas renaming table.

## TDD
Mode: off (no project/session TDD config). Functional check runner: `node tests/check.js`.

## Tasks
- [x] T1 Foundations: design tokens (dark + light, `[data-theme]` + `prefers-color-scheme`), fonts (Newsreader + IBM Plex Sans), app bar (brand, privacy note, undo/redo, glossary, copy link, theme toggle, more menu), Spanish copy pass.
- [ ] T2 Inputs: quick start (5 essentials + optional negotiated discount + live preview), 6 collapsible advanced groups with one-line summaries, inline validation (while typing + adjusted-on-blur with undo), per-section reset, undo/redo history, reset-all inline confirm.
- [ ] T3 Results: verdict + "Negociar te ahorra" + hero KPIs + narrative reading; 4 ARIA tabs (Flujo de caja, Riesgo, Estrategia, Detalle completo) redistributing all existing sections; compact summary + sticky tabs + rent control.
- [ ] T4 Mobile + a11y + states: mobile layouts (inverted heatmap, accordions, year selector for horizon, bottom rent bar), accessible help popovers (aria-describedby, click/touch/keyboard, Esc), glossary, sign+icon+word signals, chart keyboard nav + "Ver como tabla", empty/error/alert states, URL-hash scenario share, persistence notices.
- [ ] T5 i18n: language selector ES (default) / EN. Single `I18N` dictionary + `t(key,vars)` helper; all UI copy (static markup, JS-generated result text, narrative, verdicts, alerts, validation messages, glossary, tooltips/aria-labels, chart labels) routed through it. Accessible selector in app bar, persisted to `localStorage['gt-negotiation-comparator-lang']`, default 'es', updates `<html lang>`, re-renders without losing state; include `lang` in the URL-hash share if cheap. Natural EN copy (not literal translation). Numbers/calc untouched. Added mid-session by the coordinator (to run after T4).

## Route per task
All tasks: delegated direct (writer trigger: large non-trivial rewrite of `index.html`; preparation trigger: reading 18 design artboards).

## Delivery
Strategy: ask-on-risk. Forecast: >400 changed lines (full presentation rewrite) — chain strategy to be asked before PR.

## Progress / evidence
- Branch: `feat/ux-redesign`
- RDD: off (global) — ordinary checks only.
- T1 done, commit `397f5e9` — CSS tokens (dark/light) on `[data-theme]` + `prefers-color-scheme`, Newsreader+IBM Plex Sans via Google Fonts link, new `.appbar` (brand+pixel favicon, privacy note, undo/redo buttons present but disabled — wired in T2, glossary toggle with stub panel content — filled in T4, copy-scenario-link via `location.hash` + clipboard, theme toggle persisted to `localStorage['gt-negotiation-comparator-theme']`, more-menu with "Restablecer todo"/"Acerca de"). Renamed `LABEL`/`SHORT` JS constants ('Principal'→'Pedido', 'Propiedad principal'→'Precio pedido') since used across every render function. Deferred: full Spanish copy pass on the input-panel field labels and JS-generated result copy — those templates get replaced wholesale in T2/T3, so translating them now would be redone; not worth double work.
  - Verification: `node tests/check.js` → All checks passed. CALC/DEFAULTS blocks byte-identical to `main` (diff empty). `new Function(...)` parse check → `js ok`. Browser smoke test (file:// via preview): app bar renders in both themes, theme toggle switches `data-theme` and computed colors correctly (dark bg `rgb(7,13,28)`, light bg `rgb(244,245,248)`), more-menu opens/closes.

## Next step
T2.
