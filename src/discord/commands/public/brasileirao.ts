import { ApplicationCommandOptionType } from 'discord.js'
import { BrasileiraoScraper } from '#services'
import { createCommand } from '#base'

createCommand({
  name: 'brasileirao',
  description: 'Mostra informações sobre o Brasileirão',
  options: [
    {
      name: 'tabela',
      description: 'Mostra a tabela atual do Brasileirão',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'jogos',
      description: 'Mostra os próximos jogos da rodada',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  async run(interaction) {
    const scraper = new BrasileiraoScraper()

    try {
      await scraper.initialize()

      if (interaction.options.getSubcommand() === 'tabela') {
        //TODO: Implementar a lógica para buscar a tabela do Brasileirão
        const table = await scraper.getTabela()

        console.log('Tabela do Brasileirão:', table)

        await interaction.reply('Em breve, a tabela do Brasileirão estará disponível.')
      } else if (interaction.options.getSubcommand() === 'jogos') {
        //TODO: Implementar a lógica para buscar os próximos jogos do Brasileirão

        await interaction.reply('Em breve, os próximos jogos do Brasileirão estarão disponíveis.')
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Brasileirão:', error)
      await interaction.reply('Desculpe, ocorreu um erro ao buscar os dados do Brasileirão.')
    } finally {
      await scraper.close()
    }
  },
})
