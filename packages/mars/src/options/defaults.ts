export function getDefaultOptions() {
  return {
    // The API key were generated for public use. We recommend specifying your own
    etherscanApiKey: '2DPNE83H5VD53GPM3FK4EK98IXPDEFSBCV',
    infuraApiKey: 'f21d1fe4b8c9455faa3a60222236c26e',
    sources: './contracts',
    waffleConfig: './waffle.json',
    network: 'mainnet',
    outputFile: './deployments.json',
  }
}
