import { ArgumentParser } from 'argparse'

export interface GenerateOptions {
  input: string
  output: string
}

export const parseGenerateArgs = (): GenerateOptions => {
  const parser = new ArgumentParser({
    description: 'M.A.R.S. - Magically Augmented Release Scripts',
  })

  parser.add_argument('-i', '--input', {
    help: 'contracts directory',
    type: String,
    default: './build',
  })
  parser.add_argument('-o', '--output', {
    help: 'output file path',
    type: String,
    default: './build/artifacts.ts',
  })

  return parser.parse_args()
}
