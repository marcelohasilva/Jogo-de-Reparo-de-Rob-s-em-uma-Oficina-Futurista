export type Priority = 'Emergência' | 'Padrão' | 'Baixo risco'
export type ComponentPart = {
  id: string
  name: string
  code: string
  seconds: number
}
export type Robot = {
  id: string
  model: string
  priority: Priority
  parts: ComponentPart[]
  totalParts: number
  createdAt: number
}
export type CompletedRobot = {
  id: string
  model: string
  priority: Priority
  partsRepaired: number
  seconds: number
  completedAt: number
}
export type GameRecord = {
  name: string
  robots: number
  parts: number
  seconds: number
  date: number
}