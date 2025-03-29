import { ApplicationCommandOptionType, Colors, EmbedBuilder } from 'discord.js'
import { BrasileiraoScraper, cbfSerieAUrl, globoEsporteSerieAUrl } from '#services'
import { createCommand } from '#base'

import dayjs from 'dayjs'

import isToday from 'dayjs/plugin/isToday.js'
import isTomorrow from 'dayjs/plugin/isTomorrow.js'

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

        const embed = new EmbedBuilder()
          .setTitle(`Tabela do Brasileirão ${season}`)
          .setThumbnail('https://www.cbf.com.br/_next/image?url=%2Flogo%2Flogo-borda.png')
          .setDescription('Aqui está a tabela atual do Brasileirão:')
          .setColor(Colors.Gold)
          .setTimestamp()
          .setFooter({ text: 'Fonte: CBF' })
          .setURL(cbfSerieAUrl)

        await interaction.reply({ embeds: [embed] })
      }

      if (interaction.options.getSubcommand() === 'jogos') {
        const { games, round } = await scraper.getNextGames()

        if (games.length === 0) {
          await interaction.reply('Não há jogos programados para o Brasileirão no momento.')
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

        await interaction.reply({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Brasileirão:', error)
      await interaction.reply('Desculpe, ocorreu um erro ao buscar os dados do Brasileirão.')
    } finally {
      await scraper.close()
    }
  },
})
