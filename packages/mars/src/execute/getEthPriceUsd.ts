import fetch from 'node-fetch'

export async function getEthPriceUsd(): Promise<number> {
  try {
    const res = await fetch('https://api.coinpaprika.com/v1/tickers/eth-ethereum')
    const data = await res.json()
    return data.quotes.USD.price
  } catch {
    return 0
  }
}
