const fs = require("fs");
const path = require("path");
const argv = process.argv;

const args = argv.slice(2, argv.length);
const tpl = fs.readFileSync("./.tpl").toString();

if (!args.length) {
  throw new Error("path is null");
}

let filepath = args[0];

let title = filepath.replace(/.md$/, "");

if (!filepath.match(/\.md$/)) {
  filepath = filepath + ".md";
}

const txt = tpl.replace("$1", title).replace("$2", getDateString());

const savePath = path.resolve("./", filepath);

if (!fs.existsSync(savePath)) {
  fs.writeFileSync(path.resolve("./", filepath), txt);
} else {
  throw new Error(`file ${filepath} is exist`);
}

function getDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${fullZero(date.getMonth() + 1)}-${fullZero(
    date.getDate()
  )} ${fullZero(date.getHours())}:${fullZero(date.getMinutes())}:${fullZero(
    date.getSeconds()
  )}`;
}

function fullZero(number) {
  if (number.toString().length == 1) {
    number = "0" + number;
  }
  return number;
}
