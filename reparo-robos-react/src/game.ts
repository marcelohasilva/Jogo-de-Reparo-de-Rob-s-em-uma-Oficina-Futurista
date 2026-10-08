import type { ComponentPart, Priority, Robot } from './types'

const models = ['NEXUS-7', 'ORBIT-X', 'ATLAS MK-II', 'PIXEL-04', 'TITAN-Q', 'ECHO-9']
const partNames = ['Servo do braço', 'Núcleo de energia', 'Sensor óptico', 'Placa de controle', 'Articulação da perna', 'Módulo de comunicação']
const priorities: Priority[] = ['Emergência', 'Padrão', 'Baixo risco']
const random = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export function createRobot(): Robot {
  const count = Math.floor(Math.random() * 3) + 1
  const parts: ComponentPart[] = Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    name: random(partNames),
    code: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(100 + Math.random() * 900)}`,
    seconds: Math.floor(5 + Math.random() * 16),
  }))
  return {
    id: crypto.randomUUID(),
    model: random(models),
    priority: random(priorities),
    parts,
    totalParts: parts.length,
    createdAt: Date.now(),
  }
}