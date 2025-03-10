import { PrismaClient } from '@prisma/client'
import { messageRepository } from './repositories/index.js'

export const prisma = new PrismaClient()

export const repositories = { messageRepository }
