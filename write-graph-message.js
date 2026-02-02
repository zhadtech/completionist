/**
 * Writes the message from binary.csv onto the GitHub commit graph.
 *
 * GitHub graph: Sunday = top row (CSV row 0), Saturday = bottom row (CSV row 6).
 * Each column in the CSV = one week. Grid is 7 rows × N columns.
 *
 * Usage: node write-graph-message.js [startDate]
 *   startDate: ISO date (e.g. 2025-01-06). The Monday of that week is used
 *   as the first column. Default: 52 weeks ago from today (so message fits in last year).
 *
 * Env: DRY_RUN=1 to preview; COMMITS_PER_DAY=N (default 10) commits per marked day.
 */

import { readFileSync } from "fs";
import moment from "moment";
import jsonfile from "jsonfile";
import simpleGit from "simple-git";

const DATA_PATH = "./data.json";
const CSV_PATH = "./binary.csv";

// --- Parameters (adjust these) ---
// Start date: Monday of this week will be column 0. Pass as CLI arg or set here.
const START_DATE_ARG = process.argv[2];
const START_DATE = START_DATE_ARG
  ? moment(START_DATE_ARG).startOf("isoWeek") // Monday of given week
  : moment().subtract(52, "weeks").startOf("isoWeek");

// Commits per marked day (same day, multiple commits for intensity on the graph)
const COMMITS_PER_DAY = parseInt(process.env.COMMITS_PER_DAY || "20", 10);

// Set to true to only print commits (dry run); false to actually commit and push
const DRY_RUN = process.env.DRY_RUN === "1";

function loadGrid() {
  const raw = readFileSync(CSV_PATH, "utf-8");
  const rows = raw
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((v) => v.trim()));
  if (rows.length !== 7) {
    throw new Error(`Expected 7 rows in binary.csv, got ${rows.length}`);
  }
  const numCols = rows[0].length;
  const grid = rows.map((row) => row.map((v) => Number(v) === 1));
  return { grid, numCols };
}

function getCommitDates(grid, numCols) {
  const dates = [];
  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < 7; row++) {
      if (grid[row][col]) {
        // row 0 = Sunday (top), row 1 = Monday, ..., row 6 = Saturday (bottom)
        const dayOffset = row - 1; // Sunday = -1 day from Monday, Monday = 0, ...
        const dateStr = moment(START_DATE)
          .add(col, "weeks")
          .add(dayOffset, "days")
          .format();
        for (let n = 0; n < COMMITS_PER_DAY; n++) {
          dates.push(dateStr);
        }
      }
    }
  }
  return dates.sort();
}

async function makeCommit(dateStr) {
  const data = { date: dateStr };
  await jsonfile.writeFile(DATA_PATH, data);
  const git = simpleGit();
  await git.add([DATA_PATH]);
  await git.commit(dateStr, ["--date", dateStr]);
}

async function main() {
  const { grid, numCols } = loadGrid();
  const dates = getCommitDates(grid, numCols);

  console.log(
    `Start date (Monday of week): ${START_DATE.format("YYYY-MM-DD")}`
  );
  console.log(`Commits per marked day: ${COMMITS_PER_DAY}`);
  console.log(`Total commits to make: ${dates.length}`);
  console.log(
    `Date range: ${dates[0]} … ${dates[dates.length - 1]}`
  );

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Would create commits on these dates:");
    dates.slice(0, 20).forEach((d) => console.log("  ", d));
    if (dates.length > 20) console.log("  ... and", dates.length - 20, "more");
    return;
  }

  for (let i = 0; i < dates.length; i++) {
    await makeCommit(dates[i]);
    if ((i + 1) % 100 === 0) console.log(`Committed ${i + 1}/${dates.length}`);
  }
  console.log(`Done. Pushing ${dates.length} commits...`);
  // await simpleGit().push();
  // console.log("Push complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
