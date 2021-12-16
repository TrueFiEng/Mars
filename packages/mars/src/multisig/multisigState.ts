// TODO: consider if State pattern could be useful with regard to MultisigBuilder and MultisigExecutable
import { read, save } from '../execute/save'

export type MultisigState = Unknown | Proposed | Executed

export type Unknown = {
  kind: 'UNKNOWN'
}

export type Proposed = {
  kind: 'PROPOSED'
  id: string
}

export type Executed = {
  kind: 'EXECUTED'
  id: string
}

/**
 * A multisig section in deployments file
 */
interface SavedMultisigSection {
  [name: string]: SavedMultisigEntry
}

/**
 * A single entry in the multisig section of deployments file
 */
export interface SavedMultisigEntry {
  id: string
  state: string
}

const multisigDeploymentFileSection = '_multisig'

function readMultisigSection(file: string, network: string): SavedMultisigSection | undefined {
  const allMultisigsSection = read<SavedMultisigSection>(file, network, multisigDeploymentFileSection)

  if (!allMultisigsSection) return undefined
  else return allMultisigsSection
}

export function readSavedMultisig(file: string, network: string, multisigName: string): SavedMultisigEntry | undefined {
  const allMultisigsSection = readMultisigSection(file, network)

  return allMultisigsSection ? allMultisigsSection[multisigName] : undefined
}

export function saveMultisig(file: string, network: string, name: string, entry: SavedMultisigEntry): void {
  const allMultisigsSection = readMultisigSection(file, network) ?? {}
  allMultisigsSection[name] = entry

  save(file, network, multisigDeploymentFileSection, allMultisigsSection)
}
