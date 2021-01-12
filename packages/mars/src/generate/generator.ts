import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, dirname, join, relative, resolve } from 'path'
import { Abi, AbiComponent, AbiEntry, AbiParam } from '../abi'

export const Result = null as any
export type Transaction = unknown

export function runGenerator(inDir: string, outFile: string) {
  const files = readdirSync(resolve(inDir))

  const defs = []
  const imports = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue

    const json = JSON.parse(readFileSync(join(resolve(inDir), file), { encoding: 'utf-8' }))
    const { abi, bytecode } = json

    if (!bytecode || bytecode === '0x') continue

    imports.push(makeJsonImport(resolve(inDir), file, resolve(outFile)))
    defs.push(makeDefinition(basename(file, '.json'), abi))
  }

  const source = makeSource(imports, defs)

  writeFileSync(resolve(outFile), source)
}

function makeSource(imports: string[], defs: string[]) {
  return 'import * as Mars from "ethereum-mars";\n\n' + imports.join('\n') + '\n\n' + defs.join('\n\n') + '\n'
}

function makeJsonImport(sourcePath: string, sourceFile: string, outPath: string) {
  const name = basename(sourceFile, '.json')
  const relativePath = relative(dirname(outPath), join(sourcePath, sourceFile))
  return `const ${name}__JSON = require("./${relativePath}");`
}

function makeDefinition(name: string, abi: Abi) {
  const constructor = abi.find((fun: any) => fun.type === 'constructor')
  const functions = abi.filter((fun: any) => fun.type === 'function')

  const methods = functions.map((fun: any) => `${fun.name}${makeArguments(fun)}: ${makeReturn(fun)};`)
  methods.unshift(`new${makeArguments(constructor)}: void;`)

  const generic = `{\n  ${methods.join('\n  ')}\n}`
  const artifact = `Mars.createArtifact<${generic}>("${name}", ${name}__JSON)`

  return `export const ${name} = ${artifact};`
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
  const args = abi.inputs.map(
    (input: AbiParam) => `${getInputName(input)}: ${makeInputType(input.type, input.components)}`
  )
  if (
    'stateMutability' in abi &&
    abi.stateMutability !== 'view' &&
    abi.stateMutability !== 'pure' &&
    abi.type !== 'constructor'
  ) {
    if (args.length === 0) {
      return '(options?: Mars.TransactionOverrides)'
    }
    return `(${args.join(', ')}, options?: Mars.TransactionOverrides)`
  }
  return `(${args.join(', ')})`
}

function makeInputType(type: string, components?: AbiComponent[]): string {
  if (type.endsWith('[]')) {
    return `Mars.MaybeFuture<${makeInputType(type.slice(0, -2), components)}[]>`
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'Mars.NumberLike'
  }
  if (type === 'tuple' && components) {
    return `Mars.MaybeFuture<{${components
      .map(({ name, type, components }) => `${name}: ${makeInputType(type, components)}`)
      .join(', ')}}>`
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

function makeOutputsType(outputs: AbiParam[]) {
  if (outputs.length === 1) {
    return makeOutputType(outputs[0].type, outputs[0].components)
  } else {
    return `Mars.Future<[${outputs.map(({ type, components }) => makeOutputType(type, components)).join(', ')}]>`
  }
}

function makeOutputType(type: string, components?: AbiComponent[]): string {
  if (type.endsWith('[]')) {
    return `Mars.Future<${makeOutputType(type.slice(0, -2), components)}[]>`
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'Mars.FutureNumber'
  }
  if (type === 'tuple' && components) {
    return `Mars.Future<{${components
      .map(({ name, type, components }) => `${name}: ${makeOutputType(type, components)}`)
      .join(', ')}}>`
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
  if (abi.stateMutability !== 'view' && abi.stateMutability !== 'pure') return 'Mars.Transaction'
  if (!abi.outputs || abi.outputs.length === 0) return 'void'
  return makeOutputsType(abi.outputs)
}
