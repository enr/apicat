/*
https://github.com/enr/apicat
*/

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');

var args =
  // .epilog('---')
  require('yargs/yargs')(process.argv.slice(2))
    .usage('Concat OpenAPI specs.\nUsage: $0 [OPTIONS]')
    .alias('b', 'base-dir')
    .nargs('b', 1)
    .describe('b', 'Base directory for specs')
    .option('d', {
      alias: 'destination',
      default: 'build/',
      describe: 'Destination directory for created specs',
      type: 'string',
      nags: 1,
    })
    .option('n', {
      alias: 'file-name',
      describe: 'Destination file for created specs. Default: "openapi-${TIMESTAMP}". Extension will be added',
      type: 'string',
      nags: 1,
    })
    .demandOption(['b'])
    .help('h')
    .alias('h', 'help').argv;

const specsBaseDir = path.resolve(args.b);
if (!fs.existsSync(specsBaseDir)) {
  console.error('ERROR: base directory not found', specsBaseDir);
  process.exit(1);
}
if (!fs.lstatSync(specsBaseDir).isDirectory()) {
  console.error('ERROR: not a directory ', specsBaseDir);
  process.exit(1);
}

const destinationDir = path.resolve(args.d);
const destinationDirExists = fs.existsSync(destinationDir);
if (destinationDirExists && !fs.lstatSync(destinationDir).isDirectory()) {
  console.error('ERROR: invalid path for destination directory ', destinationDir);
  process.exit(1);
}

if (!destinationDirExists) {
  try {
    fs.mkdirSync(destinationDir, { recursive: true });
  } catch (e) {
    console.error('ERROR: fail directory ', destinationDir);
    process.exit(1);
  }
}

const fprefix = '_';
const fext = 'json';
const now = new Date();
const ts = `${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
const f = args.n ? `${args.n}.${fext}` : `openapi-${ts}.${fext}`
const resultsFile = path.resolve(destinationDir, f);

const dp = path.resolve(specsBaseDir, `${fprefix}defaults.${fext}`);
if (!fs.existsSync(dp)) {
  console.error('ERROR: file not found', dp);
  process.exit(1);
}

const db = path.resolve(specsBaseDir, `${fprefix}base.${fext}`);
if (!fs.existsSync(db)) {
  console.error('ERROR: file not found', db);
  process.exit(1);
}

const oapaths = {
  dir: specsBaseDir,
  defaults: dp,
  base: db,
};

const defaults = JSON.parse(fs.readFileSync(oapaths.defaults));
const base = JSON.parse(fs.readFileSync(oapaths.base));
let openapi = Object.assign(defaults, base);

const filterSpecFiles = function filterSpecFiles(f) {
  return !f.startsWith('_') && f.endsWith(fext);
};

let files = [];
fs.readdirSync(specsBaseDir)
  .filter(filterSpecFiles)
  .forEach((file) => {
    files.push(path.resolve(specsBaseDir, file));
  });

const specs = files.map((element) => {
  return JSON.parse(fs.readFileSync(element));
});

let paths = openapi.paths || {};
let schemas = openapi.components.schemas || {};
let tags = openapi.tags || [];
let externalDocs = openapi.externalDocs || {};
specs.forEach(function (item, index) {
  paths = Object.assign(paths, item.paths);
  schemas = Object.assign(schemas, item.components.schemas);
  tags = tags.concat(item.tags);
  externalDocs = Object.assign(externalDocs, item.externalDocs);
});
openapi.paths = paths;
openapi.components.schemas = schemas;
openapi.tags = tags;
openapi.externalDocs = externalDocs;

try {
  console.log(`Writing results to ${resultsFile}`);
  fs.writeFileSync(resultsFile, JSON.stringify(openapi, null, 2));
} catch (err) {
  console.error(err);
  process.exit(1);
}
