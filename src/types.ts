export interface PlayerCareer {
  club: string
  clubColor: string
  years: string
  appearances: number
  goals: number
  assists: number | null
}

export interface PlayerData {
  found: true
  fullName: string
  nationality: string
  nationalityFlag: string
  age: number
  position: string
  shirtNumber: number | null
  currentClub: string
  englishName: string
  funFact: string
  personalLife: string
  achievements: string
  career: PlayerCareer[]
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
