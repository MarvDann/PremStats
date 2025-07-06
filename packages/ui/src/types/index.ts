import { JSX } from 'solid-js'

export interface BaseComponentProps {
  class?: string
  children?: JSX.Element
}

export interface VariantProps {
  variant?: string
  size?: string
}

export interface ComponentWithVariants extends BaseComponentProps, VariantProps {}

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export type InputVariant = 'default' | 'destructive'
export type InputSize = 'sm' | 'md' | 'lg'

export type CardVariant = 'default' | 'outlined' | 'elevated'

export interface FootballData {
  team?: {
    id: string
    name: string
    logo?: string
    stadium?: string
  }
  player?: {
    id: string
    name: string
    position?: string
    number?: number
    team?: string
  }
  match?: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    date: string
    status?: string
  }
  stats?: {
    label: string
    value: number | string
    description?: string
  }
}