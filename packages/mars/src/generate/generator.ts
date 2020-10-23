import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, dirname, join, relative, resolve } from 'path'
import { Abi, AbiEntry, AbiParam } from '../abi'

export const Result = null as any
export type Transaction = any

export function runGenerator(inDir: string, outFile: string) {
  const files = readdirSync(resolve(inDir))

  const defs = []
  const imports = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue

    imports.push(makeJsonImport(resolve(inDir), file, resolve(outFile)))

    const json = JSON.parse(readFileSync(join(resolve(inDir), file), { encoding: 'utf-8' }))
    const { abi } = json

    defs.push(makeDefinition(basename(file, '.json'), abi))
  }

  const source = makeSource(imports, defs)

  writeFileSync(resolve(outFile), source)
}

function makeSource(imports: string[], defs: string[]) {
  return `
import * as Mars from 'ethereum-mars';

${imports.join('\n')}

${defs.join('\n\n')}
  `
}

function makeJsonImport(sourcePath: string, sourceFile: string, outPath: string) {
  const name = basename(sourceFile, '.json')
  const relativePath = relative(dirname(outPath), join(sourcePath, sourceFile))
  return `const ${name}JSON = require('./${relativePath}')`
}

function makeDefinition(name: string, abi: Abi) {
  const constructor = abi.find((fun: any) => fun.type === 'constructor')
  const functions = abi.filter((fun: any) => fun.type === 'function')

  const methods = functions.map((fun: any) => `${fun.name}: ${makeArguments(fun)}: ${makeReturn(fun)} => Mars.Result`)
  return `
export const ${name} = Mars.createArtifact({
  name: "${name}",
  constructor: ${makeArguments(constructor)}: void => Mars.Result,
  methods: {
    ${methods.join(',\n    ')}
  },
  abi: ${name}JSON.abi,
  bytecode: ${name}JSON.bytecode,
});
`
}

function makeArguments(abi: AbiEntry | undefined) {
  if (!abi) {
    return `()`
  }
  let unnamedParamsCount = 0
  const getInputName = (input: AbiParam) => {
    if (input.name) {
      return input.name
    }
    return '_'.repeat(++unnamedParamsCount)
  }
  const args = abi.inputs.map((input: AbiParam) => `${getInputName(input)}: ${makeInputType(input.type)}`)
  return `(${args.join(', ')})`
}

function makeInputType(type: string): string {
  if (type.endsWith('[]')) {
    return `Mars.MaybeFuture<${makeInputType(type.slice(0, -2))}[]>`
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'Mars.NumberLike'
  }
  if (type === 'address') {
    return 'Mars.AddressLike'
  }
  if (type === 'bool') {
    return 'Mars.BooleanLike'
  }
  if (type === 'string') {
    return 'Mars.StringLike'
  }
  if (type.startsWith('byte')) {
    return 'Mars.BytesLike'
  }
  throw new Error(`Unknown type ${type}`)
}

function makeOutputType(type: string): string {
  if (type.endsWith('[]')) {
    return `Mars.Future<${makeOutputType(type.slice(0, -2))}[]>`
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'Mars.FutureNumber'
  }
  if (type === 'address' || type === 'string') {
    return 'Mars.Future<string>'
  }
  if (type === 'bool') {
    return 'Mars.FutureBoolean'
  }
  if (type.startsWith('byte')) {
    return 'Mars.FutureBytes'
  }
  throw new Error(`Unknown type ${type}`)
}

function makeReturn(abi: any) {
  if (abi.stateMutability !== 'view') return 'Mars.Transaction'
  if (!abi.outputs || abi.outputs.length === 0) return 'void'
  return makeOutputType(abi.outputs[0].type)
}
