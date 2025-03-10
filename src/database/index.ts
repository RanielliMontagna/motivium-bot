import { QuickDB } from 'quick.db'

import { GuildData } from './interfaces/GuildData.js'
import { MemberData } from './interfaces/MemberData.js'
import { MessageData } from './interfaces/MessageData.js'

import * as repositories from './repositories/index.js'

const filePath = rootTo('localdb.sqlite')

const db = {
  guilds: new QuickDB<GuildData>({ filePath, table: 'guilds' }),
  members: new QuickDB<MemberData>({ filePath, table: 'members' }),
  messages: new QuickDB<MessageData>({ filePath, table: 'messages' }),
}

export { db, repositories }
