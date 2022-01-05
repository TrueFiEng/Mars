import fs from 'fs'

export interface SaveEntry {
  txHash?: string
  address: string
  multisig: boolean
}

export function save<T>(fileName: string, network: string, key: string, value: T) {
  let contents: any = {}
  if (fs.existsSync(fileName)) {
    contents = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  }
  contents[network] = contents[network] ?? {}
  contents[network][key] = value
  fs.writeFileSync(fileName, JSON.stringify(contents, null, 2) + '\n')
}

export function read<T>(fileName: string, network: string, key: string): T | undefined {
  let contents: any = {}
  if (fs.existsSync(fileName)) {
    contents = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  }
  contents[network] = contents[network] ?? {}
  return contents[network][key]
}
