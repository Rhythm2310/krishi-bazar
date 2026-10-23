# Task-prompt.md: UIU Calculator

Everything from this folder to production, in order. You run no scripts: you push to GitHub, flip a few Jules settings, paste prompts, and merge pull requests.

**What you have:** 6 tasks in 4 waves, up to 3 Jules agents at once. Each agent writes its tests first, reviews its own code on two axes (does it do what was asked, does it follow the standards), and opens one pull request. CI blocks edits outside an agent's files and blocks TODOs, stubs, skipped tests and swallowed errors. A review task checks the whole feature before anything reaches `main`.

## Part 1: Put it on GitHub
1. Extract this zip next to your project. Your project must be a normal git clone (with its history).
2. Copy everything inside `uiu-calculator-swarm-pack/` into your project root, hidden folders (`.jules`, `.agents`, `.github`) included.
   - Mac/Linux: `cd your-project && cp -R ../uiu-calculator-swarm-pack/. .`
   - Windows PowerShell: `cd your-project; Copy-Item -Recurse -Force ..\uiu-calculator-swarm-pack\* .`
   - This pack replaces these files of yours (their content is merged into the new version): `AGENTS.md`, `GLOSSARY.md`, `docs/adr/**`, `.jules/**`, `.github/**`, `.agents/skills/**`.
3. Commit and push the pack to `main`:
   ```
   git add -A
   git commit -m "chore: jules swarm setup"
   git push
   ```
   If `main` is protected, push a branch, open a pull request, and merge it before continuing.


## Part 2: One-time Jules setup (about 5 minutes)
1. Connect the repo to Jules (jules.google, with the GitHub app installed and allowed to access this repo).
2. In Jules Settings turn on **CI Auto-Fixer (Beta)**. It repairs failing CI checks on PRs Jules opened.
3. Turn on plan auto-approval so no session waits for you. (Labels can change; look for the setting that approves plans automatically.)
4. Open the repo in Jules, go to Configuration, then Initial Setup. Paste the contents of `.jules/setup-script.txt`, click **Run and Snapshot**, and wait for success.
5. This plan needs no secrets for the agents. If one appears later, add it as a Jules repo environment variable and never commit it.
6. GitHub, Settings, Branches: protect `main`. Require pull requests and the `verify`, `ownership-guard` and `slop-guard` checks. Block force pushes.
7. GitHub, Actions: make sure workflows are enabled. The CI file is `.github/workflows/ci.yml`.

## Part 3: Run the swarm
Rules that apply to every wave:
- In Jules, choose the repo and the branch **`main`** before pasting a prompt. Every session starts from it.
- Paste one prompt per session. Start all prompts of a wave together.
- Do not start a wave until every pull request of the previous wave is merged into `main` and its checks are green. Waves exist because later work builds on earlier work.
- Merge a wave's pull requests in any order; the agents never touch the same files. Merge with the normal merge button.
- A PR whose title contains `[PARTIAL]`, or a new file under `.jules/requests/`, means an agent hit a gap. Read its report (`.jules/reports/T0X.md`, shown in the PR), then follow Part 6 before the next wave.

### Wave 0: 1 agent(s) together

**Tick when merged:**

- [ ] T01 Foundation scaffold contracts data and tracer (PR title starts with `[T01]`)

**Prompts** (one Jules session each):

#### T01: Foundation scaffold contracts data and tracer (model: gemini pro 15)

```text
You are Jules agent T01 in a coordinated swarm (wave 0).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T01-foundation.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: package.json, package-lock.json, .gitignore, svelte.config.js, vite.config.ts, tsconfig.json, eslint.config.js, .prettierrc, .prettierignore, playwright.config.ts, src/app.html, src/app.css, src/app.d.ts, src/routes/+layout.svelte, src/routes/+layout.ts, src/routes/+page.svelte, src/lib/domain/contracts.ts, src/lib/domain/data/**, src/lib/domain/grading/**, static/**, tests/e2e/smoke.spec.ts, .github/workflows/** (plus .jules/reports/T01.md). Everything else is read-only.
4. Branch jules/T01-foundation. PR title must start with "[T01]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: none
Skills to load first: domain-language, tdd, codebase-design, code-review, pr
```

### Wave 1: 3 agent(s) together

**Gate:** every pull request of wave 0 is merged into `main` and its checks are green. Then start every session below from `main`.

**Tick when merged:**

- [ ] T02 Grading and Cgpa domain engine (PR title starts with `[T02]`)
- [ ] T03 Fee engine domain module (PR title starts with `[T03]`)
- [ ] T05 README and Vercel deployment guide (PR title starts with `[T05]`)

**Prompts** (one Jules session each):

#### T02: Grading and Cgpa domain engine (model: gemini pro 15)

```text
You are Jules agent T02 in a coordinated swarm (wave 1).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T02-cgpa-engine.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: src/lib/domain/grading/**, src/lib/domain/cgpa/** (plus .jules/reports/T02.md). Everything else is read-only.
4. Branch jules/T02-cgpa-engine. PR title must start with "[T02]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: T01
Skills to load first: domain-language, tdd, codebase-design, code-review, pr
```

#### T03: Fee engine domain module (model: gemini pro 15)

```text
You are Jules agent T03 in a coordinated swarm (wave 1).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T03-fee-engine.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: src/lib/domain/fees/** (plus .jules/reports/T03.md). Everything else is read-only.
4. Branch jules/T03-fee-engine. PR title must start with "[T03]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: T01
Skills to load first: domain-language, tdd, codebase-design, code-review, pr
```

#### T05: README and Vercel deployment guide (model: gemini pro 15)

```text
You are Jules agent T05 in a coordinated swarm (wave 1).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T05-docs.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: README.md, docs/deployment.md (plus .jules/reports/T05.md). Everything else is read-only.
4. Branch jules/T05-docs. PR title must start with "[T05]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: T01
Skills to load first: domain-language, pr
```

### Wave 2: 1 agent(s) together

**Gate:** every pull request of wave 1 is merged into `main` and its checks are green. Then start every session below from `main`.

**Tick when merged:**

- [ ] T04 Planner UI with page flow tests (PR title starts with `[T04]`)

**Prompts** (one Jules session each):

#### T04: Planner UI with page flow tests (model: gemini pro 15)

```text
You are Jules agent T04 in a coordinated swarm (wave 2).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T04-planner-ui.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: src/routes/+page.svelte, src/lib/components/**, src/lib/stores/**, src/lib/format/**, tests/e2e/** (plus .jules/reports/T04.md). Everything else is read-only.
4. Branch jules/T04-planner-ui. PR title must start with "[T04]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: T01, T02, T03
Skills to load first: domain-language, tdd, code-review, pr
```

### Wave 3: 1 agent(s) together

**Gate:** every pull request of wave 2 is merged into `main` and its checks are green. Then start every session below from `main`.

**Tick when merged:**

- [ ] T06 Strict review of merged codebase (PR title starts with `[T06]`)

**Prompts** (one Jules session each):

#### T06: Strict review of merged codebase (model: gemini pro 15)

```text
You are Jules agent T06 in a coordinated swarm (wave 3).
1. Read /AGENTS.md fully. It is the law. Use the words of GLOSSARY.md.
2. Read .jules/tasks/T06-review.md and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: .jules/reports/T06.md (plus .jules/reports/T06.md). Everything else is read-only.
4. Branch jules/T06-review. PR title must start with "[T06]". Base branch: main.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: T01, T02, T03, T04, T05
Skills to load first: code-review, codebase-design
```


## Part 4: Review and fix
The last wave contains a review task (T06). It reads everything merged since the start and writes `.jules/reports/T06.md` with Spec, Standards and Cross-task findings. It changes no code.
1. After its pull request merges, open `.jules/reports/T06.md` on GitHub.
2. Read the last line. If it lists nothing you care about, go to Part 5.
3. Otherwise open Claude with this skill and send:
   ```
   REPLAN
   Project: UIU Calculator
   [paste the full contents of .jules/reports/T06.md]
   [paste any files from .jules/requests/]
   ```
4. Claude returns a delta zip with a fix wave. Apply it (Part 7), run its prompts, then go to Part 5. Expect at most two review rounds.

## Part 5: Ship
1. Open a pull request from `main` into `main` and wait for green checks. (Skip this if the base branch is `main`.)
2. Read each task PR's **Merge Danger** section. Anything marked one-way (migrations, destructive changes, public API changes) is your decision before merging.
3. Merge with a merge commit so the task history stays readable.
4. Set the environment variables and secrets your host needs; the names are in `.env.example` and `README.md` where the project has them. Never commit secrets.
5. Deploy and smoke-test the main flow. The stories the project must satisfy are in `.jules/spec.md`.

## Part 6: When something goes wrong
| You see | Do this |
|---|---|
| `ownership-guard` fails | An agent edited a file it does not own. Comment on the PR asking the session to revert those files (the failing log names them). |
| `slop-guard` fails | The PR adds a TODO, stub, skipped test, suppressed error or similar. CI Auto-Fixer usually fixes it; if not, paste the failing log line into the session. |
| `verify` fails | Wait for CI Auto-Fixer. It stops after three tries on one failure; then paste the log into the session. |
| Jules asks a question | Reply: "Use the decision defaults in your task file and continue." |
| A session stalls or crashes | Start a fresh session with the same prompt and the same branch. |
| PR is `[PARTIAL]`, or `.jules/requests/` has files | Part 7: send them to Claude with `REPLAN`. Do not start dependent waves first. |
| A merge conflict appears | It should not. Do not resolve it by hand; send the PR links to Claude with `REPLAN`. |
| Daily task limit reached | Wait for the reset. The plan keeps 30% headroom for reruns. |
| Started from the wrong branch | Cancel the session and start again from `main`. |

## Part 7: Changing the plan later
Come back to Claude with the jules-swarm-architect skill and say one of:
- `REPLAN` plus the review report, any files from `.jules/requests/`, and the PR links of PARTIAL tasks. You get a **delta zip** with changed files and an updated `Task-prompt.md` for the next wave.
- `ADD` plus the feature you want. The glossary, decisions and plan carry over.

Apply a delta zip: extract it over your project folder (replace files when asked), commit, push to `main`, then continue from the new `Task-prompt.md`.

## What is in this folder
| Path | Purpose |
|---|---|
| `AGENTS.md` | The rules every agent follows. |
| `GLOSSARY.md`, `docs/adr/` | Shared words and the decisions behind the design. |
| `.jules/spec.md` | What is being built: user stories and test seams. |
| `.jules/tasks/`, `tasks.csv`, `ownership.csv`, `plan.md` | The work split. Each task owns its files. |
| `.jules/deps.csv` | Every dependency at a researched, pinned, stable version. |
| `.jules/tools/` | The checks CI runs, plus optional helpers (Python 3.9+, never required of you). |
| `.agents/skills/` | The engineering skills the agents read: tdd, code-review, pr, codebase-design, domain-language. Adapted from github.com/mattpocock/skills (MIT). |
| `.github/` | CI and the pull request template. |
