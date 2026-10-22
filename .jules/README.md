# Running this Jules swarm

You do not write code or plans. You copy, paste, merge and click. Everything runs through one command:

```
python .jules/tools/swarm.py <command>
```

| Command | What it does |
|---|---|
| `doctor` | Checks the pack, the plan, CI and tools. Run it before the first launch and after any change. |
| `launch` | Prints the launcher prompts for the next ready wave. Paste one prompt per Jules session. |
| `status` | Shows which tasks are merged, what is waiting, open requests, and the next step. |
| `guard` | Runs the ownership and slop checks on your current branch, the same ones CI runs. |
| `replan` | Writes `replan.md` (reports, requests, plan, history) to paste to the architect. |

Options: `launch --wave N`, `launch --task T03` (restart one task). Settings live in `.jules/swarm.json`.

## The loop
1. `doctor`. Fix anything marked FAIL. Commit and push (including the integration branch if the plan uses one).
2. In Jules settings, turn on plan auto-approval and CI Auto-Fixer (the architect's checklist lists the rest).
3. `launch`. Start one Jules session per prompt, all from the base branch named in the prompt.
4. When PRs open, wait for CI. Merge every PR of the wave (order does not matter), then `git pull`.
5. `status`. It names the next step. Repeat from step 3 until all waves are merged.
6. After the review task: `replan`, then paste `replan.md` to the architect after the word REPLAN. The architect writes a fix wave.
7. Merge the integration branch to the default branch once, after the last review.

## When something looks wrong
| Symptom | What to do |
|---|---|
| `doctor` says FAIL | Fix the named file; rerun. |
| A PR fails `ownership-guard` | The agent edited a file it does not own. Ask Jules to revert those files, or merge nothing and `replan`. |
| A PR fails `slop-guard` | The PR adds a TODO, stub, skipped test, suppressed error or similar. CI Auto-Fixer usually fixes it; otherwise comment the log line back to the session. |
| A task says PARTIAL | The agent hit a gap. Read its report; `replan` before launching dependent waves. |
| `.jules/requests/` has files | An agent needs a change in a file it does not own. `replan` resolves them. |
| A session stalls | `launch --task T0X` and start a fresh session for that task. |
| `slop_guard` cannot find the base | `git fetch origin <base branch>`, then rerun. |

Files you never edit by hand: `AGENTS.md`, `GLOSSARY.md`, `docs/adr/`, `.jules/` (except reading it), `.agents/skills/`. Change them through the architect with `REPLAN`.
