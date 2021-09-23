import { utils, providers, constants, Wallet, BigNumber } from 'ethers'
import readline from 'readline'
import { getEthPriceUsd } from './getEthPriceUsd'
import { log, yellow, blue } from './log'

export interface TransactionOptions {
  wallet: Wallet
  gasPrice: BigNumber
  gasLimit?: number | BigNumber
  noConfirm: boolean
  logFile: string
}

export async function sendTransaction(
  name: string,
  { wallet, gasPrice, noConfirm, gasLimit: overwrittenGasLimit, logFile }: TransactionOptions,
  transaction: providers.TransactionRequest
) {
  const gasLimit = overwrittenGasLimit ?? (await wallet.provider.estimateGas({ ...transaction, from: wallet.address }))
  const withGasLimit = { ...transaction, gasLimit, gasPrice }

  const price = await getEthPriceUsd()

  const fee = utils.formatEther(gasPrice.mul(gasLimit))
  const feeInUsd = (parseFloat(fee) * price).toFixed(2)
  const balance = utils.formatEther(await wallet.getBalance())
  const balanceInUsd = (parseFloat(balance) * price).toFixed(2)

  const options = { logFile: logFile, toConsole: true, toFile: true }
  log({ ...options }, yellow('Transaction:'), name)
  log({ ...options }, blue('  Fee:'), `$${feeInUsd}, Ξ${fee}`)
  log({ ...options }, blue('  Balance:'), `$${balanceInUsd}, Ξ${balance}`)
  if (!noConfirm) {
    await waitForKeyPress()
  }
  log({ ...options, toFile: false }, blue('  Sending'), '...')
  const tx = await wallet.sendTransaction(withGasLimit)
  log({ ...options }, blue('  Hash:'), tx.hash)
  log({ ...options, toConsole: false }, blue('  Hex data:'), tx.data)
  const receipt = await tx.wait()
  log({ ...options }, blue('  Block:'), receipt.blockNumber)
  if (receipt.contractAddress) {
    log({ ...options }, blue('  Address:'), receipt.contractAddress)
  }
  log({ ...options })

  return {
    txHash: receipt.transactionHash,
    address: receipt.contractAddress || constants.AddressZero,
  }
}

async function waitForKeyPress() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.write('ENTER to submit, Ctrl+C to exit...')
  return new Promise<void>((resolve) => {
    rl.on('line', () => {
      process.stdout.moveCursor(0, -1)
      process.stdout.clearLine(1)
      resolve()
      rl.close()
    })
  })
}
