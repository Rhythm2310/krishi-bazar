# .jules/ — what is here

`Task-prompt.md` at the repo root is the single start-to-production guide: GitHub steps, Jules setup, every launch prompt with tick-boxes, review and ship. Follow it — you run no scripts.

- `spec.md` (architect-owned): user stories U1–U9 and test seams S1/S2.
- `tasks.csv` + `tasks/*.md`: the work split; one order per agent. `plan.md`: architecture, waves, ownership, assumptions.
- `deps.csv`: every dependency at a researched, pinned, stable version. `swarm.json`: settings. `ownership.csv`: who may touch what.
- `tools/`: the checks CI runs (`ownership_guard.py`, `slop_guard.py`) plus optional helpers (`swarm.py` with doctor/status/launch/replan, `validate_plan.py`, `verify_deps.py`, `render_launch_sheet.py`). Optional for the human — `Task-prompt.md` already carries every prompt.
- `reports/` and `requests/`: agent outputs. Send them to the architect with `REPLAN` (see Task-prompt.md Parts 4 and 7).
