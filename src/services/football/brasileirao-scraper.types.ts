export interface Team {
  position: number
  positionChange: number
  name: string
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

export interface Table {
  year: number
  teams: Team[]
}

export interface Game {
  date: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  local: string
  status: string
}
