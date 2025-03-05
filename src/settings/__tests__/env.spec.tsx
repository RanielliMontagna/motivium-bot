import { envSchema } from '../env.js'

describe('#settings/env', () => {
  it('should validate env', () => {
    const env = { BOT_TOKEN: 'token' }
    expect(envSchema.parse(env)).toEqual(env)
  })
})
