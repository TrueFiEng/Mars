import { flattenSingleFile } from '@ethereum-waffle/compiler'

export default async (contractName: string) => {
  return `// M.A.R.S. TESTING CONTRACT
${await flattenSingleFile(
  {
    sourceDirectory: 'contracts',
  },
  contractName
)}`
}
