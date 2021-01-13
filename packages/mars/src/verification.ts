import { gatherSourcesAndCanonizeImports, ImportsFsEngine, resolvers } from '@resolver-engine/imports-fs'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import axios from 'axios'
import querystring from 'querystring'

const isDirectory = (directoryPath: string) =>
  fs.existsSync(path.resolve(directoryPath)) && fs.statSync(path.resolve(directoryPath)).isDirectory()

function findInputs(sourcePath: string) {
  const stack = [sourcePath]
  const inputFiles: string[] = []
  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dir = stack.pop()!
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      if (isDirectory(filePath)) {
        stack.push(filePath)
      } else if (file.endsWith('.sol')) {
        inputFiles.push(filePath)
      }
    }
  }
  return inputFiles
}

function fromEntries<T extends string | number | symbol, U>(args: [T, U][]) {
  return args.reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value,
    }),
    {} as Record<T, U>
  )
}

function canonizeImports(source: string, globalUrls: string[]) {
  let canonizedSource = source
  for (const globalUrl of globalUrls) {
    canonizedSource = canonizedSource.replace(new RegExp(globalUrl, 'gim'), path.basename(globalUrl))
  }
  return canonizedSource
}

export async function createJsonInputs(sourcePath: string) {
  const resolver = ImportsFsEngine().addResolver(resolvers.BacktrackFsResolver())

  const allContracts = findInputs(sourcePath)

  return fromEntries(
    await Promise.all(
      allContracts.map(async (contract) => {
        const sources = await gatherSourcesAndCanonizeImports([contract], '.', resolver)
        const globalUrls = sources.map(({ url }) => url)
        return [
          path.parse(contract).name,
          {
            sources: fromEntries(
              sources.map(({ source, url }) => [path.basename(url), { content: canonizeImports(source, globalUrls) }])
            ),
            language: 'Solidity',
          },
        ] as [
          string,
          {
            sources: {
              [key: string]: { content: string }
            }
            language: string
          }
        ]
      })
    )
  )
}

type Awaited<T> = T extends Promise<infer U> ? U : never

export type JsonInputs = Awaited<ReturnType<typeof createJsonInputs>>

const etherscanUrl = (network?: string) => {
  if (!network || network === 'mainnet') {
    return 'https://api.etherscan.io/api'
  }
  return `https://api-${network}.etherscan.io/api`
}

function getEtherscanContractAddress(address: string, network?: string) {
  if (!network || network === 'mainnet') {
    return `https://etherscan.io/address/${address}`
  }
  return `https://${network}.etherscan.io/address/${address}`
}

async function getCompilerOptions(waffleConfigPath: string) {
  const config = JSON.parse(fs.readFileSync(waffleConfigPath).toString())
  const compilerVersion = config.compilerVersion
  const isOptimized = config.compilerOptions?.optimizer?.enabled ?? true
  const optimizerRuns = !isOptimized ? 0 : config.compilerOptions?.optimizer?.runs ?? 200
  return {
    compilerVersion,
    isOptimized,
    optimizerRuns,
  }
}

async function isContractVerified(etherscanApiKey: string, address: string, network?: string) {
  const response = (
    await axios.get(
      `${etherscanUrl(network)}?${querystring.stringify({
        module: 'contract',
        action: 'getabi',
        apikey: etherscanApiKey,
        address,
      })}`
    )
  ).data
  return response?.status === '1'
}

async function getVerificationRequestBody(
  etherscanApiKey: string,
  waffleConfigPath: string,
  jsonInput: any,
  address: string,
  contractName: string,
  constructorArgs?: string
) {
  const waffleConfig = await getCompilerOptions(waffleConfigPath)
  const inputWithOptions = {
    ...jsonInput,
    settings: {
      optimizer: {
        enabled: waffleConfig.isOptimized,
        runs: waffleConfig.optimizerRuns,
      },
    },
  }
  const body = querystring.stringify({
    apikey: etherscanApiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: address.toLowerCase(),
    sourceCode: JSON.stringify(inputWithOptions),
    codeformat: 'solidity-standard-json-input',
    contractname: `${contractName}.sol:${contractName}`,
    compilerversion: waffleConfig.compilerVersion,
    constructorArguements: constructorArgs?.slice(2) ?? '',
    licenseType: '1',
  })
  return body
}

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

async function waitForContract() {
  process.stdout.write(chalk.blue('Waiting for Etherscan to acknowledge the contract...'))
  await sleep(30000)
}

function clearLine() {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
}

async function sendRequest(body: string, contractName: string, network?: string): Promise<string | undefined> {
  clearLine()
  process.stdout.write(chalk.blue('Sending request to Etherscan...'))

  const res = (
    await axios.post(etherscanUrl(network), body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    })
  ).data
  if (res.status === '0') {
    console.log(chalk.bold(chalk.yellow(`Verification of ${contractName} failed: ${res.result}`)))
    return
  }
  return res.result
}

async function waitForResult(etherscanApiKey: string, guid: string, network?: string): Promise<boolean> {
  clearLine()
  process.stdout.write(chalk.blue('Patiently waiting for verification in queue...'))
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(5000)
    const res = (
      await axios.get(
        `${etherscanUrl(network)}?${querystring.stringify({
          apikey: etherscanApiKey,
          guid,
          module: 'contract',
          action: 'checkverifystatus',
        })}`
      )
    ).data
    if (res.result.startsWith('Fail')) {
      clearLine()
      console.log(chalk.bold(chalk.yellow(`Verification of failed: ${res.result}`)))
      return false
    }
    if (res.result.startsWith('Pass')) {
      clearLine()
      return true
    }
  }
}

export async function verify(
  etherscanApiKey: string,
  jsonInputs: JsonInputs,
  waffleConfigPath: string,
  contractName: string,
  address: string,
  constructorArgs?: string,
  network?: string
) {
  const jsonInput = jsonInputs[contractName]
  if (!jsonInput) {
    console.log(chalk.bold(chalk.yellow(`No sources found for ${contractName}. Skipping\n`)))
    return
  }
  if (await isContractVerified(etherscanApiKey, address, network)) {
    console.log(chalk.bold(chalk.green(`Contract ${contractName} is already verified under ${address}. Skipping\n`)))
    return
  }
  console.log(chalk.green(`Verifying ${contractName} on Etherscan`))
  try {
    const body = await getVerificationRequestBody(
      etherscanApiKey,
      waffleConfigPath,
      jsonInput,
      address,
      contractName,
      constructorArgs
    )
    await waitForContract()
    const guid = await sendRequest(body, contractName, network)
    if (!guid) {
      return
    }
    if (await waitForResult(etherscanApiKey, guid)) {
      console.log(chalk.bold(chalk.green(`Contract verified at ${getEtherscanContractAddress(address, network)}\n`)))
    }
  } catch (err) {
    console.log(chalk.bold(chalk.yellow(`Error during verification: ${err.message ?? err}. Skipping\n`)))
  }
}
