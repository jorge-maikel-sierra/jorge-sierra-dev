export interface Project {
  title: string
  full_name?: string
  description: string
  tags: string[]
  url?: string
  repo?: string
  image?: string | null
  stars?: number
  forks?: number
  language?: string
  updatedAt?: string
}
