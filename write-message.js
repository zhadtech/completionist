import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "data.json");

// 2-wide × 7-tall bitmap font (col 0–1, row 0–6). Each char = array of [col, row] to fill.
const font = {
  " ": [],
  E: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,3],[1,6]],
  V: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,5],[1,6]],
  e: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,1],[1,2],[1,3],[1,4],[1,5]],
  r: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,1]],
  t: [[0,0],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6]],
  h: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,3],[1,4],[1,5],[1,6]],
  i: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
  n: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,1],[1,2],[1,3],[1,6]],
  g: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,0],[1,1],[1,5],[1,6]],
  s: [[0,0],[0,1],[0,3],[0,4],[0,5],[0,6],[1,0],[1,1],[1,3],[1,4],[1,5],[1,6]],
  p: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,1],[1,2],[1,3]],
  o: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,1],[1,2],[1,3],[1,4],[1,5]],
  b: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,1],[1,2],[1,3],[1,5],[1,6]],
  l: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
};

const WIDTH = 2;  // columns per character
const HEIGHT = 7; // rows (days 0–6)

function markCommit(x, y, callback) {
  const date = moment()
    .subtract(1, "y")
    .add(1, "d")
    .add(x, "w")
    .add(y, "d")
    .format();

  const data = { date };

  jsonfile.writeFile(dataPath, data, (err) => {
    if (err) {
      console.error(err);
      if (callback) callback(err);
      return;
    }
    simpleGit(__dirname)
      .add([dataPath])
      .commit(date, { "--date": date })
      .push(() => {
        if (callback) callback();
      });
  });
}

function textToCoords(text) {
  const coords = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const glyph = font[ch] ?? font[" "];
    const startX = i * WIDTH;
    for (const [cx, cy] of glyph) {
      coords.push([startX + cx, cy]);
    }
  }
  return coords;
}

function runSequentially(coords, index, done) {
  if (index >= coords.length) {
    if (done) done();
    return;
  }
  const [x, y] = coords[index];
  console.log(`Commit ${index + 1}/${coords.length}: (${x}, ${y})`);
  markCommit(x, y, (err) => {
    if (err) {
      console.error(err);
      if (done) done(err);
      return;
    }
    runSequentially(coords, index + 1, done);
  });
}

const message = "Everything is possible";
const coords = textToCoords(message);

console.log(`Writing "${message}" (${coords.length} commits)…`);
runSequentially(coords, 0, (err) => {
  if (err) process.exit(1);
  console.log("Done.");
});
