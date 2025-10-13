import { bootstrap } from '#base'
import dayjs from 'dayjs'

import 'dayjs/locale/pt-br.js'
dayjs.locale('pt-br')

const originalConsoleError = console.error
console.error = (...args: any[]) => {
  console.log('error args:', args) // Debug log to see the arguments

  const message = args.join(' ')
  if (
    typeof message === 'string' &&
    message.includes('TIMEOUT') &&
    message.includes('updates.js')
  ) {
    return
  }
  originalConsoleError(...args)
}

process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = String(reason)
  if (errorMessage.includes('TIMEOUT')) {
    return
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

await bootstrap({ meta: import.meta })
