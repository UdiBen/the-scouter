export interface PlayerCareer {
  club: string
  clubColor: string
  years: string
  appearances: number
  goals: number
  assists: number | null
}

export interface Trophy {
  name: string
  emoji: string
  count: number
  category: 'league' | 'europe' | 'international' | 'individual'
}

export interface PlayingStyle {
  speed: number
  dribbling: number
  shooting: number
  passing: number
  defense: number
  physical: number
  description: string
}

export interface TimelineEvent {
  year: number
  event: string
}

export interface SimilarPlayer {
  name: string
  englishName: string
  flag: string
  relation: string
}

export interface IconicMoment {
  year: number
  match: string
  emoji: string
  description: string
}

export interface PlayerData {
  found: true
  fullName: string
  displayName?: string
  nationality: string
  nationalityFlag: string
  age: number
  position: string
  shirtNumber: number | null
  status: string
  currentClub: string
  englishName: string
  funFact: string
  personalLife: string
  achievements: string
  career: PlayerCareer[]
  trophies?: Trophy[]
  playingStyle?: PlayingStyle
  timeline?: TimelineEvent[]
  similarPlayers?: SimilarPlayer[]
  iconicMoments?: IconicMoment[]
}

export interface PlayerNotFound {
  found: false
}

export type PlayerResponse = PlayerData | PlayerNotFound

export interface CachedPlayer {
  data: PlayerData
  imageUrl: string | null
  timestamp: number
}

export interface AutocompletePlayer {
  name: string
  flag: string
}
