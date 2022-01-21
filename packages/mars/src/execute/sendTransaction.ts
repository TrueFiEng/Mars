import { BigNumber, constants, providers, Signer, utils } from 'ethers'
import readline from 'readline'
import { getEthPriceUsd } from './getEthPriceUsd'
import chalk from 'chalk'
import { logTx } from '../logging'

export interface TransactionOptions {
  signer: Signer
  gasPrice: BigNumber
  gasLimit?: number | BigNumber
  noConfirm: boolean
  logFile: string
}

export async function withGas(
  transaction: providers.TransactionRequest,
  gasLimit: number | BigNumber | undefined,
  gasPrice: BigNumber,
  signer: Signer
): Promise<providers.TransactionRequest & { gasLimit: number | BigNumber }> {
  const effectiveGasLimit = gasLimit ?? (await signer.estimateGas({ ...transaction, from: await signer.getAddress() }))
  return { ...transaction, gasLimit: effectiveGasLimit, gasPrice }
}

export async function sendTransaction(
  name: string,
  { signer, gasPrice, noConfirm, gasLimit: overwrittenGasLimit }: TransactionOptions,
  transaction: providers.TransactionRequest
) {
  const txWithGas = await withGas(transaction, overwrittenGasLimit, gasPrice, signer)

  const price = await getEthPriceUsd()

  const fee = utils.formatEther(gasPrice.mul(txWithGas.gasLimit))
  const feeInUsd = (parseFloat(fee) * price).toFixed(2)
  const balance = utils.formatEther(await signer.getBalance())
  const balanceInUsd = (parseFloat(balance) * price).toFixed(2)

  console.log(chalk.yellow('Transaction:'), name)
  console.log(chalk.blue('  Fee:'), `$${feeInUsd}, Ξ${fee}`)
  console.log(chalk.blue('  Balance:'), `$${balanceInUsd}, Ξ${balance}`)
  if (!noConfirm) {
    await waitForKeyPress()
  }
  console.log(chalk.blue('  Sending'), '...')
  const tx = await signer.sendTransaction(txWithGas)
  console.log(chalk.blue('  Hash:'), tx.hash)
  const receipt = await tx.wait()
  console.log(chalk.blue('  Block:'), receipt.blockNumber)
  if (receipt.contractAddress) {
    console.log(chalk.blue('  Address:'), receipt.contractAddress)
  }
  console.log()

  logTx(name, tx)

  return {
    txHash: receipt.transactionHash,
    address: receipt.contractAddress || constants.AddressZero,
    txWithGas,
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
