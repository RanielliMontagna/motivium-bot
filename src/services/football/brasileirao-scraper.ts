import puppeteer from 'puppeteer'

const cbfUrl = 'https://www.cbf.com.br'
const serieAUrl = `${cbfUrl}/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a`

export interface Team {
  position: number
  positionChange: number
  team: string
  badge: string | null
  points: number
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  yellowCards: number
  redCards: number
  performance: number
}

export interface Tabela {
  year: number
  teams: Team[]
}

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

  async getTabela(year: number = new Date().getFullYear()): Promise<Tabela> {
    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    const page = await this.browser.newPage()

    await page.goto(`${serieAUrl}/${new Date().getFullYear()}`)

    const data = await page.evaluate(() => {
      const tabela = document.querySelector('table')

      if (!tabela) {
        throw new Error('Tabela not found')
      }

      const rows = tabela.querySelectorAll('tbody tr')

      const data = Array.from(rows).map((row) => {
        const columns = row.querySelectorAll('td')

        const posicao = columns[0].querySelector('strong')?.textContent
        const posicaoAlteracao = columns[0].querySelector('span')?.textContent
        const time = columns[0].querySelector('strong:nth-child(2)')?.textContent
        const escudo = columns[0].querySelector('img')?.getAttribute('src')

        return {
          position: parseInt(posicao || '0'),
          positionChange: parseInt(posicaoAlteracao?.replace('(', '').replace(')', '') || '0'),
          team: time || '',
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
}
