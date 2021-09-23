import chalk from 'chalk';
import fs from 'fs'

class ChalkedString {
  raw: string;
  chalked: string;

  constructor(raw: string, chalked: string) {
    this.raw = raw;
    this.chalked = chalked;
  }

  public toString() {
    return this.chalked;
  }
}

interface LogOptions {
  toConsole?: boolean,
  toFile?: boolean,
  logFile: string,
}

export function log(
  {toConsole, toFile, logFile}: LogOptions,
  ...args: any[]
) {
  if (toConsole) {
    console.log(...args.map((val) => val instanceof ChalkedString ? val.chalked : val))
  }
  if (logFile && toFile) {
    fs.appendFileSync(logFile, args.map((val) => val instanceof ChalkedString ? val.raw : val).join(' ') + '\n')
  }
}

export function yellow(text: string) {
  return new ChalkedString(text, chalk.yellow(text))
}

export function blue(text: string) {
  return new ChalkedString(text, chalk.blue(text))
}
