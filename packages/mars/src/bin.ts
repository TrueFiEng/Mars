import { parseGenerateArgs } from './cli'
import { runGenerator } from './generator'

const args = parseGenerateArgs()

runGenerator(args.input, args.output)
