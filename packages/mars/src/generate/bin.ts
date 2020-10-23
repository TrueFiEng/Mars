import { parseGenerateArgs } from './parseGenerateArgs'
import { runGenerator } from './generator'

const args = parseGenerateArgs()
runGenerator(args.input, args.output)
