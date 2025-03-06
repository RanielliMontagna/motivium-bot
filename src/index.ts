import { bootstrap } from '#base'
import dayjs from 'dayjs'

import 'dayjs/locale/pt-br.js'
dayjs.locale('pt-br')

await bootstrap({ meta: import.meta })
