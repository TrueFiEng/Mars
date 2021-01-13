import { utils, providers, constants, Wallet, BigNumber } from 'ethers'
import readline from 'readline'
import chalk from 'chalk'
import { getEthPriceUsd } from './getEthPriceUsd'

export interface TransactionOptions {
  wallet: Wallet
  gasPrice: BigNumber
  gasLimit?: number | BigNumber
  noConfirm: boolean
}

export async function sendTransaction(
  name: string,
  { wallet, gasPrice, noConfirm, gasLimit: overwrittenGasLimit }: TransactionOptions,
  transaction: providers.TransactionRequest
) {
  const gasLimit = overwrittenGasLimit ?? (await wallet.provider.estimateGas({ ...transaction, from: wallet.address }))
  const withGasLimit = { ...transaction, gasLimit, gasPrice }

  const price = await getEthPriceUsd()

  const fee = utils.formatEther(gasPrice.mul(gasLimit))
  const feeInUsd = (parseFloat(fee) * price).toFixed(2)
  const balance = utils.formatEther(await wallet.getBalance())
  const balanceInUsd = (parseFloat(balance) * price).toFixed(2)

  console.log(chalk.yellow('Transaction:'), name)
  console.log(chalk.blue('  Fee:'), `$${feeInUsd}, Ξ${fee}`)
  console.log(chalk.blue('  Balance:'), `$${balanceInUsd}, Ξ${balance}`)
  if (!noConfirm) {
    await waitForKeyPress()
  }
  console.log(chalk.blue('  Sending'), '...')
  const tx = await wallet.sendTransaction(withGasLimit)
  console.log(chalk.blue('  Hash:'), tx.hash)
  const receipt = await tx.wait()
  console.log(chalk.blue('  Block:'), receipt.blockNumber)
  if (receipt.contractAddress) {
    console.log(chalk.blue('  Address:'), receipt.contractAddress)
  }
  console.log()

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
