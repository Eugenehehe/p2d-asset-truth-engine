# P2D Asset Truth Engine

A browser-based, synthetic-data MVP for reconciling IT asset location and lifecycle evidence before a human-approved system-of-record update.

## GitHub Pages demo

The live demo is a static HTML/CSS/JavaScript application and includes:

- Dashboard metrics and exception filters
- Decision and reviewer queues
- Evidence trace and P2D gates
- Confidence levels and reason codes
- Browser-session reviewer decisions
- CSV exports

All records are synthetic.

## Project boundary

A Flowtrac-style platform remains the operational system of record. P2D is an evidence, conflict-resolution, and human-review layer before controlled updates.

## Evidence sources represented

- Operational inventory record
- Official asset lifecycle status
- Network discovery and DNS clues
- Physical Bin/Rack/U audit
- Spare storage check
- Surplus or disposal receipt

## Deployment

GitHub Actions publishes the `site/` folder to GitHub Pages whenever `main` changes. In this repository, open **Settings → Pages** and set **Source** to **GitHub Actions** once if it is not already enabled.

## Safety

This project contains synthetic records only. Do not upload confidential or restricted organizational data to unapproved environments.
