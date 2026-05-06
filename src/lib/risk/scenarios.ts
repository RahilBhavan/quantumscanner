export interface CrqcScenario {
  readonly id: 'conservative' | 'base' | 'aggressive'
  readonly label: string
  readonly windowLabel: string
  readonly crqcMidYear: number
  readonly weight: number
}

export const CRQC_SCENARIOS: readonly CrqcScenario[] = Object.freeze([
  {
    id: 'conservative',
    label: 'Conservative',
    windowLabel: '2040+',
    crqcMidYear: 2042,
    weight: 0.6,
  },
  {
    id: 'base',
    label: 'Base',
    windowLabel: '2033–2037',
    crqcMidYear: 2035,
    weight: 0.85,
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    windowLabel: '2029–2032',
    crqcMidYear: 2030,
    weight: 1.0,
  },
])
