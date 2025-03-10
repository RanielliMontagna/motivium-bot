import { envSchema } from '../env.js'

describe('#settings/env', () => {
  it('should validate env', () => {
    const env = { BOT_TOKEN: 'token', DATABASE_URL: 'url' }
    expect(envSchema.parse(env)).toEqual(env)
  })
})
