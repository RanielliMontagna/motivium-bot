import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import puppeteer from 'puppeteer'
import nodeHtmlToImage from 'node-html-to-image'

import { ApplicationCommandOptionType, Colors, EmbedBuilder } from 'discord.js'
import { BrasileiraoScraper, globoEsporteSerieAUrl } from '#services'
import { createCommand } from '#base'

import isToday from 'dayjs/plugin/isToday.js'
import isTomorrow from 'dayjs/plugin/isTomorrow.js'
import { fileURLToPath } from 'url'

dayjs.extend(isToday)
dayjs.extend(isTomorrow)

const currentYear = new Date().getFullYear()

createCommand({
  name: 'brasileirao',
  description: 'Mostra informações sobre o Brasileirão',
  options: [
    {
      name: 'tabela',
      description: 'Mostra a tabela atual do Brasileirão',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'temporada',
          description: `Escolha a temporada do Brasileirão (Se não for escolhida, será a atual - ${currentYear})`,
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: `${currentYear}`, value: `${currentYear}` },
            { name: `${currentYear - 1}`, value: `${currentYear - 1}` },
            { name: `${currentYear - 2}`, value: `${currentYear - 2}` },
          ],
        },
      ],
    },
    {
      name: 'jogos',
      description: 'Mostra os próximos jogos do Brasileirão',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  async run(interaction) {
    const scraper = new BrasileiraoScraper()

    await interaction.deferReply()

    try {
      await scraper.initialize()

      if (interaction.options.getSubcommand() === 'tabela') {
        const season = interaction.options.getString('temporada')
          ? Number(interaction.options.getString('temporada'))
          : currentYear

        const table = await scraper.getTable(season)

        if (table.teams.length === 0) {
          await interaction.reply('Não foi possível encontrar a tabela do Brasileirão.')
          return
        }

        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const _tablefile = path.join(__dirname, 'table.html')

        const image = await nodeHtmlToImage({
          html: fs.readFileSync(_tablefile, 'utf8'),
          quality: 100,
          type: 'png',
          puppeteer,
          content: {
            title: `Campeonato Brasileiro - Série A - ${season}`,
            teams: table.teams.map((team) => ({
              position: team.position,
              positionChange: team.positionChange,
              name: team.name,
              badge: team.badge,
              points: team.points || 0,
              matches: team.matches || 0,
              wins: team.wins || 0,
              draws: team.draws || 0,
              losses: team.losses || 0,
              goalsFor: team.goalsFor || 0,
              goalsAgainst: team.goalsAgainst,
              goalDifference: team.goalDifference,
              yellowCards: team.yellowCards,
              redCards: team.redCards,
              performance: team.performance,
            })),
            logoSrc: 'public/assets/football/cbf.svg',
          },
        })

        if (!Buffer.isBuffer(image)) {
          throw new Error('Failed to generate image as Buffer.')
        }

        await interaction.editReply({
          content: `Tabela do Brasileirão - ${season}`,
          files: [
            {
              attachment: image,
              name: `brasileirao-${season}.png`,
            },
          ],
        })
      }

      if (interaction.options.getSubcommand() === 'jogos') {
        const { games, round } = await scraper.getNextGames()

        if (games.length === 0) {
          await interaction.editReply('Não há jogos programados para o Brasileirão no momento.')
          return
        }

        const embed = new EmbedBuilder()
          .setTitle('⚽ Jogos do brasileirão ⚽')
          .setDescription(`Estes são os jogos da ${round} do Brasileirão:`)
          .setColor(Colors.Green)
          .setTimestamp()
          .setFooter({ text: 'Fonte: Globo Esporte' })
          .setURL(globoEsporteSerieAUrl)

        games.forEach((game, index) => {
          const day = dayjs(game.date).format('DD/MM')
          const dayOfWeek = dayjs(game.date)
            .format('dddd')
            .replace(/^\w/, (c) => c.toUpperCase())
          const time = dayjs(game.date).format('HH:mm')
          const isToday = dayjs(game.date).isToday()
          const isTomorrow = dayjs(game.date).isTomorrow()
          const dateLabel = `${day} • ${isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : dayOfWeek} • ${time}`

          embed.addFields({
            name: `**${game.homeTeam}** vs **${game.awayTeam}**`,
            value: `${dateLabel}`,
            inline: true,
          })

          // two columns of games
          if (index % 2 === 1) {
            embed.addFields({ name: '\t', value: '\t' })
          }
        })

        await interaction.editReply({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Brasileirão:', error)
      await interaction.editReply('Desculpe, ocorreu um erro ao buscar os dados do Brasileirão.')
    } finally {
      await scraper.close()
    }
  },
})
