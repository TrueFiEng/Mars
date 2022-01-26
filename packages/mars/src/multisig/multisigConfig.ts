import { Signer } from 'ethers'

export interface MultisigConfig {
  networkChainId: number
  gnosisSafeAddress: string
  gnosisServiceUri: string
  multisigSigner: Signer
}

/**
 * Returns either a valid multisig configuration or undefined in case multisig is not configured at all.
 * It guarantees that no invalid/partial multisig configuration is ever to be processed.
 * @param config multisig configuration -like structure
 */
export function ensureMultisigConfig(config: Partial<MultisigConfig>): MultisigConfig | undefined {
  const intendedToBeEnabled = !!(config.gnosisSafeAddress || config.gnosisServiceUri)
  const fullyConfigured = !!(config.gnosisSafeAddress && config.gnosisServiceUri)

  if (!intendedToBeEnabled) return undefined

  if (!fullyConfigured)
    throw new Error(
      'Invalid multisig configuration. ' +
        `Chain ID=${config.networkChainId}, Safe=${config.gnosisSafeAddress}, Service=${config.gnosisServiceUri}`
    )

  return config as MultisigConfig
}
