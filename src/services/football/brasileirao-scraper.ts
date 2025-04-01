import puppeteer from 'puppeteer'

import type { Game, Table, Team } from './brasileirao-scraper.types.js'

export const cbfUrl = 'https://www.cbf.com.br'
export const cbfSerieAUrl = `${cbfUrl}/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a`

export const globoEsporteUrl = 'https://ge.globo.com'
export const globoEsporteSerieAUrl = `${globoEsporteUrl}/futebol/brasileirao-serie-a/`

export class BrasileiraoScraper {
  private browser: puppeteer.Browser | null = null

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'shell',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async getTable(year: number = new Date().getFullYear()): Promise<Table> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()

    await page.goto(`${cbfSerieAUrl}/${new Date().getFullYear()}`)

    const data = await page.evaluate(() => {
      const table = document.querySelector('table')

      if (!table) throw new Error('Table not found')

      const rows = table.querySelectorAll('tbody tr')

      const data = Array.from(rows).map((row) => {
        const columns = row.querySelectorAll('td')

        const posicao = columns[0].querySelector('strong')?.textContent
        const posicaoAlteracao = columns[0].querySelector('span')?.textContent
        const time = columns[0].querySelector('strong:nth-child(2)')?.textContent
        const escudo = columns[0].querySelector('img')?.getAttribute('src')?.split('?')[0]

        return {
          position: parseInt(posicao || '0'),
          positionChange: parseInt(posicaoAlteracao?.replace('(', '').replace(')', '') || '0'),
          name: time || '',
          badge: escudo,
          points: parseInt(columns[1].textContent || '0'),
          matches: parseInt(columns[2].textContent || '0'),
          wins: parseInt(columns[3].textContent || '0'),
          draws: parseInt(columns[4].textContent || '0'),
          losses: parseInt(columns[5].textContent || '0'),
          goalsFor: parseInt(columns[6].textContent || '0'),
          goalsAgainst: parseInt(columns[7].textContent || '0'),
          goalDifference: parseInt(columns[8].textContent || '0'),
          yellowCards: parseInt(columns[9].textContent || '0'),
          redCards: parseInt(columns[10].textContent || '0'),
          performance: parseFloat(columns[11].textContent?.replace('%', '') || '0'),
        } as Team
      })

      return { teams: data }
    })

    await page.close()

    return {
      year,
      teams: data.teams.map((team) => ({
        ...team,
        badge: team.badge ? `${cbfUrl}${team.badge}` : null,
      })),
    }
  }

  async getNextGames(): Promise<{ games: Game[]; round: string }> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()

    await page.goto(`${globoEsporteSerieAUrl}`)

    console.log('Acessando a página de jogos do Brasileirão...')

    const data = await page.evaluate(() => {
      const games = document.querySelectorAll('li.lista-jogos__jogo')

      if (!games.length) throw new Error('Games not found')

      const data = Array.from(games).map((game) => {
        const date = game.querySelector('meta[itemprop="startDate"]')?.getAttribute('content')
        const homeTeam = game.querySelector(
          'div.placar__equipes--mandante span.equipes__nome',
        )?.textContent
        const awayTeam = game.querySelector(
          'div.placar__equipes--visitante span.equipes__nome',
        )?.textContent
        const homeScore = game.querySelector('.placar-box__valor--mandante')?.textContent
        const awayScore = game.querySelector('.placar-box__valor--visitante')?.textContent
        const local = game.querySelector('span.jogo__informacoes--local')?.textContent

        return {
          date: date?.toString() || '',
          awayScore: awayScore,
          homeScore: homeScore,
          awayTeam: awayTeam || '',
          homeTeam: homeTeam || '',
          local: local || '',
          status: game.querySelector('span.jogo__transmissao--broadcast ')?.textContent || '',
        }
      })

      return data as Game[]
    })

    const round = await page.evaluate(() => {
      const round = document.querySelector('span.lista-jogos__navegacao--rodada')?.textContent
      return round?.replace('Rodada ', '') || ''
    })

    await page.close()

    return { games: data, round }
  }
}
