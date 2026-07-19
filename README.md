# P2D Asset Truth Engine

A browser-based, synthetic-data MVP for reconciling IT asset location and lifecycle evidence before a human-approved system-of-record update.

## Included labs

### Asset Reconciliation Workbench

- Dashboard metrics and exception filters
- Decision and reviewer queues
- Evidence trace and P2D gates
- Confidence levels and reason codes
- Browser-session reviewer decisions
- CSV exports

### PhytoFlow resource scheduling lab

A plant-inspired, browser-based scheduling simulator that compares a reactive least-loaded baseline with a stress-memory-aware strategy. The experiment models:

- Multi-timescale stress memory
- Source–sink resource scoring
- Data-local placement
- Safety reserves for recurring pressure
- Reversible workload dormancy
- Graceful low-memory degradation
- OOM, SLA, data-movement, utilization, and completion metrics

All workloads and records are synthetic.

## Project boundary

A Flowtrac-style platform remains the operational system of record. P2D is an evidence, conflict-resolution, and human-review layer before controlled updates. PhytoFlow is an experimental simulation and does not manage production infrastructure.

## Evidence sources represented

- Operational inventory record
- Official asset lifecycle status
- Network discovery and DNS clues
- Physical Bin/Rack/U audit
- Spare storage check
- Surplus or disposal receipt

## Deployment

### Vercel

The repository includes `vercel.json` and deploys the `site/` directory as a static project. The main workbench is available at `/` and the PhytoFlow lab at `/phytoflow`.

### GitHub Pages

GitHub Actions publishes the `site/` folder to GitHub Pages whenever `main` changes. In this repository, open **Settings → Pages** and set **Source** to **GitHub Actions** once if it is not already enabled.

## Safety

This project contains synthetic records only. Do not upload confidential or restricted organizational data to unapproved environments.
