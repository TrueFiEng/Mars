import { ethers } from 'ethers'
import { hexlify } from 'ethers/lib/utils'

/***
 * Creates a deterministic contract address derived from the input arguments.
 * It uses CREATE2 opcode and follows its semantic.
 * Useful for preparing sequences of contract interaction without the contract being deployed yet.
 *
 * Borrowed from: https://gist.github.com/miguelmota/c9102d370a3c1891dbd23e821be82ae2
 *
 * @param creatorAddress the address that invokes or will invoke the CREATE2 call
 * @param salt generated sequence of 32 bytes
 * @param byteCode the contract bytecode
 */
export function computeCreate2Address(creatorAddress: string, salt: Uint8Array, byteCode: string): string {
  if (salt.length != 32) throw new Error(`Invalid salt length. Should be 32-byte array. Is ${salt.length} long.`)

  const addressWithout0x = creatorAddress.slice(2)
  const saltStringWithout0x = hexlify(salt).slice(2)
  const byteCodeHashWithout0x = ethers.utils.keccak256(`0x${byteCode}`).slice(2)
  const parts = ['ff', addressWithout0x, saltStringWithout0x, byteCodeHashWithout0x]
  const joinedParts = `0x${parts.join('')}`
  const partsHash = ethers.utils.keccak256(joinedParts)
  const last40Bytes = `0x${partsHash.slice(-40)}`.toLowerCase()

  return last40Bytes
}
