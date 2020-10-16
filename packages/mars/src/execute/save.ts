import fs from 'fs'

export interface SaveEntry {
  txHash: string
  address: string
}

export function save(fileName: string, network: string, key: string, value: SaveEntry) {
  let contents: any = {}
  if (fs.existsSync(fileName)) {
    contents = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  }
  contents[network] = contents[network] ?? {}
  contents[network][key] = value
  fs.writeFileSync(fileName, JSON.stringify(contents, null, 2) + '\n')
}

export function read(fileName: string, network: string, key: string): SaveEntry | undefined {
  let contents: any = {}
  if (fs.existsSync(fileName)) {
    contents = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  }
  contents[network] = contents[network] ?? {}
  return contents[network][key]
}
