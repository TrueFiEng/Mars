import fs from 'fs'

export type LogMode = {
  console: boolean
  file: boolean
}

export const logConfig = {
  mode: {} as LogMode,
  filepath: '',
}

export function log(...args: string[]) {
  const argsJoined = args.join('\n') + '\n'

  if (logConfig.mode.console) {
    console.log(argsJoined)
  }

  if (logConfig.mode.file && logConfig.filepath) {
    fs.appendFileSync(logConfig.filepath, argsJoined)
  }
}
