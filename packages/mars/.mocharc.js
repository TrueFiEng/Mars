process.env.NODE_ENV = 'test'
module.exports = {
  extension: ['ts'],
  spec: [
    './test/**/*.test.ts',
    './test/**/*.e2e.ts'
  ],
  require: [
    'ts-node/register',
    'source-map-support/register'
  ],
  timeout: 12000
}
