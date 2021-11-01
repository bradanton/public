import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { help } from '../utils/ent-helpers';
import * as utils from '../utils/utils';
import { exec } from 'child_process';


const platform = os.platform();
const curDir = process.cwd();
const curFolder = path.basename(curDir);

const grokDir = path.join(os.homedir(), '.grok');
const confPath = path.join(grokDir, 'config.yaml');

const templateDir = path.join(path.dirname(path.dirname(__dirname)), 'package-template');
const confTemplateDir = path.join(path.dirname(path.dirname(__dirname)), 'config-template.yaml');

// @ts-ignore
const confTemplate = yaml.safeLoad(fs.readFileSync(confTemplateDir));

let dependencies: string[] = [];

function createDirectoryContents(name: string, config: utils.Config, templateDir: string, packageDir: string, ide: string = '', ts: boolean = false, eslint: boolean = false) {
  const filesToCreate = fs.readdirSync(templateDir);

  filesToCreate.forEach(file => {
    const origFilePath = path.join(templateDir, file);
    let copyFilePath = path.join(packageDir, file);
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      if (file === 'package.png') {
        fs.writeFileSync(copyFilePath, fs.readFileSync(origFilePath, 'base64'), 'base64');
        return false;
      }
      let contents = fs.readFileSync((file === 'webpack.config.js' && ts) ?
        path.join(templateDir, 'ts.webpack.config.js') : origFilePath, 'utf8');
      contents = contents.replace(/#{PACKAGE_NAME}/g, name);
      contents = contents.replace(/#{PACKAGE_DETECTORS_NAME}/g, utils.kebabToCamelCase(name));
      contents = contents.replace(/#{PACKAGE_NAME_LOWERCASE}/g, name.toLowerCase());
      contents = contents.replace(/#{PACKAGE_NAME_LOWERCASE_WORD}/g, name.replace(/-/g, '').toLowerCase());
      contents = contents.replace(/#{GROK_HOST_ALIAS}/g, config.default);
      contents = contents.replace(/#{GROK_HOST}/g, /localhost|127\.0\.0\.1/.test(config['servers'][config.default]['url']) ?
        'http://localhost:63343/login.html' : (new URL(config['servers'][config.default]['url'])).origin);
      if (file === 'package.json') {
        // Generate scripts for non-default servers from `config.yaml`
        let _package = JSON.parse(contents);
        for (let server in config.servers) {
          if (server === config.default) continue;
          _package['scripts'][`debug-${name.toLowerCase()}-${server}`] = `grok publish ${server} --rebuild`;
          _package['scripts'][`release-${name.toLowerCase()}-${server}`] = `grok publish ${server} --rebuild --release`;
        }
        if (ts) Object.assign(_package.dependencies, { 'ts-loader': 'latest', 'typescript': 'latest' });
        if (eslint) {
          Object.assign(_package.devDependencies, {
            'eslint': 'latest',
            'eslint-config-google': 'latest',
          }, ts ? {
            '@typescript-eslint/eslint-plugin': 'latest',
            '@typescript-eslint/parser': 'latest',
          } : {});
          Object.assign(_package.scripts, {
            'lint': `eslint src${ts ? ' --ext .ts' : ''}`,
            'lint-fix': `eslint src${ts ? ' --ext .ts' : ''} --fix`,
          });
        }
        // Save module names for installation prompt
        for (let [module, tag] of Object.entries(Object.assign({}, _package.dependencies, _package.devDependencies)))
          dependencies.push(`${module}@${tag}`);
        contents = JSON.stringify(_package, null, '\t');
      }
      if (file === 'package.js' && ts) copyFilePath = path.join(packageDir, 'package.ts');
      if (file === 'tsconfig.json' && !ts) return false;
      if (file === 'ts.webpack.config.js') return false;
      if (file === '.eslintrc.json') {
        if (!eslint) return false;
        if (ts) {
          let eslintConf = JSON.parse(contents);
          eslintConf.parser = '@typescript-eslint/parser';
          eslintConf.plugins = ['@typescript-eslint'];
          contents = JSON.stringify(eslintConf, null, '\t');
        }
      }
      if (file === 'gitignore') {
        copyFilePath = path.join(packageDir, '.gitignore');
        if (ts) contents += '\n# Emitted *.js files\nsrc/**/*.js\n';
      }
      fs.writeFileSync(copyFilePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      if (file === '.vscode' && !(ide == 'vscode' && platform == 'win32')) return;
      fs.mkdirSync(copyFilePath);
      // recursive call
      createDirectoryContents(name, config, origFilePath, copyFilePath, ide, ts);
    }
  })
}

export function create(args: CreateArgs) {
  const nOptions = Object.keys(args).length - 1;
  const nArgs = args['_'].length;
  if (nArgs > 2 || nOptions > 3) return false;
  if (nOptions && !Object.keys(args).slice(1).every(op => ['ide', 'ts', 'eslint'].includes(op))) return false;

  // Create `config.yaml` if it doesn't exist yet
  if (!fs.existsSync(grokDir)) fs.mkdirSync(grokDir);
  // @ts-ignore
  if (!fs.existsSync(confPath)) fs.writeFileSync(confPath, yaml.safeDump(confTemplate));

  // @ts-ignore
  const config = yaml.safeLoad(fs.readFileSync(confPath));

  const name = nArgs === 2 ? args['_'][1] : curFolder;
  const validName = /^([A-Za-z\-_\d])+$/.test(name);

  if (validName) {
    let packageDir = curDir;
    if (curFolder !== name) {
      packageDir = path.join(packageDir, name);
      if (!fs.existsSync(packageDir)) {
        fs.mkdirSync(packageDir);
      }
    }
    if (!utils.isEmpty(packageDir)) {
      console.log();
      console.log('The package directory should be empty');
      return false;
    }
    createDirectoryContents(name, config, templateDir, packageDir, args.ide, args.ts, args.eslint);
    console.log(help.package(name, args.ts));
    console.log(`\nThe package has the following dependencies:\n${dependencies.join(' ')}\n`);

    inquirer.prompt({
      name: 'run-npm-install',
      type: 'confirm',
      message: 'Would you like to install them now with `npm`?',
      default: false,
    }).then((answers) => {
      if (!answers['run-npm-install']) return;
      console.log('\nRunning `npm install` to get the required dependencies...\n');
      exec('npm install', { cwd: packageDir }, (err, stdout, stderr) => {
        if (err) throw err;
        else console.log(stderr, stdout);
      });
    }).catch((err) => console.error(err));
  } else {
    console.log('Package name may only include letters, numbers, underscores, or hyphens');
  }
  return true;
}

interface CreateArgs {
  _: string[],
  ide?: string,
  ts?: boolean,
  eslint?: boolean,
}