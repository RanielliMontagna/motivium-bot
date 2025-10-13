import { envSchema } from '../env.js'

describe('#settings/env', () => {
  it('should validate env', () => {
    const env = { BOT_TOKEN: 'token', DATABASE_URL: 'url', PROMOTIONS_ENABLED: 'true' }
    expect(envSchema.parse(env)).toEqual(env)
  })
})
