# completionist

Draw a message or pattern on your GitHub contribution graph by turning a CSV grid into backdated commits, or randomize and populate your graph with a natural-looking schedule.

## Two main functions

| Script | Purpose |
|--------|---------|
| **`write-graph-message.js`** | Draw a message or pattern on the GitHub contribution graph. Reads `binary.csv` (7×N grid: 1 = commit, 0 = skip) and creates backdated commits so they appear on the right days. |
| **`random-commits.js`** | Fill the graph with a random schedule: 3–6 days per week, 1–3 commits per day, over a date range you choose. Backdated commits; you push manually. |

## How it works

- **`binary.csv`** is a 7×N grid: 7 rows (one per day of the week), N columns (one per week).
- **1** = make commits on that day; **0** = no commits.
- **`write-graph-message.js`** reads the CSV and creates Git commits with `--date` set so they appear on the correct day in GitHub’s graph (push is commented out in the script; push manually if desired).

GitHub’s graph uses **Sunday as the top row** and **Saturday as the bottom row**. The script maps CSV row 0 → Sunday, row 1 → Monday, … row 6 → Saturday. Each CSV column is one week; the first column is the Monday of the week you choose as the start date.

## Setup

```bash
npm install
```

## Drawing the graph

**Preview (no commits, no push):**

```bash
npm run graph:dry
# or
DRY_RUN=1 node write-graph-message.js
```

**Run for real (creates commits; push manually):**

```bash
npm run graph
# or
node write-graph-message.js
```

**Start from a specific week** (first column = Monday of that week):

```bash
node write-graph-message.js 2024-06-01
# or
npm run graph -- 2024-06-01
```

If you omit the date, the script uses **52 weeks ago** so the pattern fits in the default “last year” view.

## Options (env)

| Env | Default | Description |
|-----|---------|-------------|
| `DRY_RUN` | — | Set to `1` to only print how many commits and the date range; no Git writes. |
| `COMMITS_PER_DAY` | `20` | Number of commits to make for each marked day (darker green on the graph). |

Examples:

```bash
COMMITS_PER_DAY=5  node write-graph-message.js    # 5 commits per marked day
DRY_RUN=1          node write-graph-message.js    # preview only
```

## Random commits

**`random-commits.js`** fills the graph with a random schedule: **1–3 commits per day**, on **3–6 random days per week**. You choose when commits can start (and optionally end). No push — you push manually.

**Dry run (preview schedule and commit messages only):**

```bash
npm run random:dry
# or with a start date (default: 52 weeks ago → today)
DRY_RUN=1 node random-commits.js 2025-01-06
```

**Run for real (creates commits; no push):**

```bash
npm run random
# or with args
node random-commits.js 2025-01-06
```

**Arguments:**

| Arg | Description |
|-----|-------------|
| `startDate` | First day commits are allowed (e.g. `2025-01-06`). Default: 52 weeks ago. |
| `endDate` | Optional. An ISO date, or a **number** = weeks from start. Omit to use today. |

Examples:

```bash
DRY_RUN=1 node random-commits.js 2025-01-06           # dry run, start Jan 6, end today
DRY_RUN=1 node random-commits.js 2025-01-06 12        # dry run, 12 weeks from Jan 6
node random-commits.js 2025-01-06 2025-03-31          # real run, Jan 6 through Mar 31
```

**Options (env):**

| Env | Description |
|-----|-------------|
| `DRY_RUN=1` | Preview when commits will happen and what will be committed; no writes, no commits. |

## CSV format

- **Path:** `binary.csv`
- **Rows:** 7 (Sun, Mon, Tue, Wed, Thu, Fri, Sat — top to bottom on GitHub).
- **Columns:** One per week. Use as many as you need (e.g. 7×4 per character for 7-high, 4-wide letters).
- **Values:** `1` = commit(s) on that day, `0` = no commit. Comma-separated.

Create or edit `binary.csv` (e.g. in a spreadsheet or by hand), then run the script to turn it into commits.

## Scripts (package.json)

| Script | Command | Description |
|--------|---------|-------------|
| `graph` | `node write-graph-message.js` | Draw the graph from `binary.csv` (default start: 52 weeks ago). |
| `graph:dry` | `DRY_RUN=1 node write-graph-message.js` | Preview commit count and date range only. |
| `graph:from` | `node write-graph-message.js` | Same as `graph`; pass a date as an extra arg, e.g. `npm run graph:from -- 2024-01-01`. |
| `random` | `node random-commits.js` | Random schedule (1–3 commits/day, 3–6 days/week); pass start [end] as args. |
| `random:dry` | `DRY_RUN=1 node random-commits.js` | Preview random schedule and commit messages; no commits. |

## Other

- **`data.json`** — file that gets updated on each commit (used as commit payload).
