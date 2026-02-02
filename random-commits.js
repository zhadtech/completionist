/**
 * Random commit schedule: 1–3 commits per day, 3–6 days per week.
 * Commits are backdated; no push (you push manually).
 *
 * Usage:
 *   node random-commits.js [startDate] [endDate|weeks]
 *
 *   startDate   ISO date when commits can begin (e.g. 2025-01-01). Default: 52 weeks ago.
 *   endDate     ISO date when to stop, or a number = number of weeks from start. Default: today.
 *
 *   DRY_RUN=1   Preview schedule and commit messages only; no writes, no commits.
 *
 * Examples:
 *   DRY_RUN=1 node random-commits.js 2025-01-01
 *   DRY_RUN=1 node random-commits.js 2025-01-01 12
 *   node random-commits.js 2025-01-01
 */

import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const DATA_PATH = "./data.json";

const DRY_RUN = process.env.DRY_RUN === "1";

// --- Parse args ---
const startArg = process.argv[2];
const endArg = process.argv[3];

const startDate = startArg
  ? moment(startArg).startOf("day")
  : moment().subtract(52, "weeks").startOf("day");

let endDate;
if (endArg == null) {
  endDate = moment().startOf("day");
} else if (/^\d+$/.test(endArg)) {
  endDate = moment(startDate).add(parseInt(endArg, 10), "weeks").startOf("day");
} else {
  endDate = moment(endArg).startOf("day");
}

if (endDate.isBefore(startDate)) {
  console.error("End date must be on or after start date.");
  process.exit(1);
}

/**
 * Shuffle array in place (Fisher–Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = random.int(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build list of commit timestamps from startDate to endDate:
 * - 3–6 days per week (random)
 * - 1–3 commits per chosen day (random)
 * - Time within day randomized so commits sort nicely and look natural.
 */
function buildSchedule(from, to) {
  const commits = [];
  const cursor = moment(from).startOf("day");

  while (cursor.isSameOrBefore(to, "day")) {
    const weekStart = moment(cursor).startOf("isoWeek"); // Monday
    const weekEnd = moment(weekStart).add(6, "days");

    // Clamp to our range
    const rangeStart = moment.max(cursor, weekStart);
    const rangeEnd = moment.min(to, weekEnd);

    const daysInWeek = Math.max(0, rangeEnd.diff(rangeStart, "days") + 1);
    if (daysInWeek === 0) {
      cursor.add(1, "week");
      continue;
    }

    const numDays = random.int(3, Math.min(6, daysInWeek));
    const dayIndices = shuffle([...Array(daysInWeek).keys()]).slice(0, numDays);

    for (const offset of dayIndices) {
      const day = moment(rangeStart).add(offset, "days");
      const numCommits = random.int(1, 3);
      for (let c = 0; c < numCommits; c++) {
        const hour = random.int(9, 20);
        const minute = random.int(0, 59);
        const dateStr = day.clone().hour(hour).minute(minute).second(0).format();
        commits.push(dateStr);
      }
    }

    cursor.add(1, "week");
  }

  return commits.sort();
}

async function makeCommit(dateStr) {
  const data = { date: dateStr };
  await jsonfile.writeFile(DATA_PATH, data);
  const git = simpleGit();
  await git.add([DATA_PATH]);
  await git.commit(dateStr, ["--date", dateStr]);
}

async function main() {
  const schedule = buildSchedule(startDate, endDate);

  console.log("Random commit schedule");
  console.log("Start date (inclusive):", startDate.format("YYYY-MM-DD"));
  console.log("End date (inclusive):  ", endDate.format("YYYY-MM-DD"));
  console.log("Total commits:        ", schedule.length);
  console.log("");

  if (schedule.length === 0) {
    console.log("No commits in range.");
    return;
  }

  // Group by date for dry-run summary
  const byDate = {};
  for (const d of schedule) {
    const key = d.slice(0, 10);
    byDate[key] = (byDate[key] || 0) + 1;
  }
  const sortedDates = Object.keys(byDate).sort();

  console.log("Commits per day:");
  for (const d of sortedDates) {
    console.log(`  ${d}  ${byDate[d]} commit(s)`);
  }
  console.log("");

  if (DRY_RUN) {
    console.log("[DRY RUN] Would create commits with these messages (--date set to message):");
    schedule.slice(0, 25).forEach((msg) => console.log("  ", msg));
    if (schedule.length > 25) {
      console.log("  ... and", schedule.length - 25, "more");
    }
    console.log("");
    console.log("Run without DRY_RUN=1 to perform commits. No push is done.");
    return;
  }

  for (let i = 0; i < schedule.length; i++) {
    await makeCommit(schedule[i]);
    if ((i + 1) % 20 === 0 || i === schedule.length - 1) {
      console.log(`Committed ${i + 1}/${schedule.length}`);
    }
  }
  console.log("Done. Push manually when ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
