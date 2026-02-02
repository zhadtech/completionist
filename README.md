# completionist

Draw a message or pattern on your GitHub contribution graph by turning a CSV grid into backdated commits.

## How it works

- **`binary.csv`** is a 7×N grid: 7 rows (one per day of the week), N columns (one per week).
- **1** = make commits on that day; **0** = no commits.
- **`write-graph-message.js`** reads the CSV and creates Git commits with `--date` set so they appear on the right day in GitHub’s graph.

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

**Run for real (creates commits and pushes):**

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
| `COMMITS_PER_DAY` | `10` | Number of commits to make for each marked day (darker green on the graph). |

Examples:

```bash
COMMITS_PER_DAY=5  node write-graph-message.js    # 5 commits per marked day
DRY_RUN=1          node write-graph-message.js    # preview only
```

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

## Other

- **`script.js`** — older script that makes random commits on the graph (no CSV); kept for reference.
- **`data.json`** — file that gets updated on each commit (used as commit payload).
