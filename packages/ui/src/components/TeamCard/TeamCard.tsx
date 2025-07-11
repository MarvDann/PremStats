import { JSX, ParentComponent, splitProps, Show, For } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'
import { Card, CardHeader, CardContent } from '../Card'

const teamCardVariants = tv({
  base: 'hover:shadow-lg transition-shadow duration-300 cursor-pointer',
  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg'
    },
    variant: {
      default: '',
      compact: '[&_.team-logo]:w-8 [&_.team-logo]:h-8',
      featured: '[&_.team-logo]:w-16 [&_.team-logo]:h-16 p-6'
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'default'
  }
})

export interface TeamCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  name: string
  stadium?: string
  founded?: number
  manager?: string
  logo?: string
  position?: number
  points?: number
  played?: number
  won?: number
  drawn?: number
  lost?: number
  goalsFor?: number
  goalsAgainst?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'featured'
  showStats?: boolean
  formGuide?: string[] // Array of W/L/D results from last 6 matches
  class?: string
}

export const TeamCard: ParentComponent<TeamCardProps> = (props) => {
  const [local, others] = splitProps(props, [
    'name', 'stadium', 'founded', 'manager', 'logo', 'position', 'points', 
    'played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 
    'size', 'variant', 'showStats', 'formGuide', 'class'
  ])

  const getPositionColor = (position?: number) => {
    if (!position) return 'bg-muted text-muted-foreground'
    
    if (position <= 4) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (position <= 6) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (position >= 18) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-muted text-muted-foreground'
  }

  const getPositionLabel = (position?: number) => {
    if (!position) return ''
    
    if (position <= 4) return 'Champions League'
    if (position <= 6) return 'European Competition'
    if (position >= 18) return 'Relegation Zone'
    return ''
  }

  const getResultColor = (result: string) => {
    switch (result) {
    case 'W': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'L': return 'bg-rose-50 text-rose-700 border border-rose-200'
    case 'D': return 'bg-slate-100 text-slate-600 border border-slate-200'
    default: return 'bg-slate-100 text-slate-600 border border-slate-200'
    }
  }

  return (
    <Card
      class={cn(teamCardVariants({ size: local.size, variant: local.variant }), local.class)}
      {...others}
    >
      <CardHeader>
        <div class="flex items-center gap-4">
          <Show when={local.logo}>
            <img
              src={local.logo}
              alt={`${local.name} logo`}
              class="team-logo w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) {
                  fallback.style.display = 'flex'
                  fallback.classList.remove('hidden')
                }
              }}
            />
            <div class="team-logo w-12 h-12 bg-muted rounded-full hidden items-center justify-center">
              <span class="text-lg font-bold text-muted-foreground">
                {local.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </Show>
          <Show when={!local.logo}>
            <div class="team-logo w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <span class="text-lg font-bold text-muted-foreground">
                {local.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </Show>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-lg truncate">{local.name}</h3>
              <Show when={local.position}>
                <span class={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getPositionColor(local.position)
                )}>
                  #{local.position}
                </span>
              </Show>
            </div>
            <Show when={local.stadium}>
              <p class="text-sm text-muted-foreground truncate">{local.stadium}</p>
            </Show>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <Show when={local.showStats && (local.points !== undefined || local.played !== undefined)}>
          <div class="grid grid-cols-2 gap-4">
            <Show when={local.points !== undefined}>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{local.points}</div>
                <div class="text-xs text-muted-foreground">Points</div>
              </div>
            </Show>
            <Show when={local.played !== undefined}>
              <div class="text-center">
                <div class="text-2xl font-bold">{local.played}</div>
                <div class="text-xs text-muted-foreground">Played</div>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={local.showStats && (local.won !== undefined || local.drawn !== undefined || local.lost !== undefined)}>
          <div class="grid grid-cols-3 gap-2 text-center">
            <Show when={local.won !== undefined}>
              <div>
                <div class="text-lg font-semibold text-green-600">{local.won}</div>
                <div class="text-xs text-muted-foreground">Won</div>
              </div>
            </Show>
            <Show when={local.drawn !== undefined}>
              <div>
                <div class="text-lg font-semibold text-yellow-600">{local.drawn}</div>
                <div class="text-xs text-muted-foreground">Drawn</div>
              </div>
            </Show>
            <Show when={local.lost !== undefined}>
              <div>
                <div class="text-lg font-semibold text-red-600">{local.lost}</div>
                <div class="text-xs text-muted-foreground">Lost</div>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={local.showStats && (local.goalsFor !== undefined || local.goalsAgainst !== undefined)}>
          <div class="grid grid-cols-2 gap-4 text-center">
            <Show when={local.goalsFor !== undefined}>
              <div>
                <div class="text-lg font-semibold">{local.goalsFor}</div>
                <div class="text-xs text-muted-foreground">Goals For</div>
              </div>
            </Show>
            <Show when={local.goalsAgainst !== undefined}>
              <div>
                <div class="text-lg font-semibold">{local.goalsAgainst}</div>
                <div class="text-xs text-muted-foreground">Goals Against</div>
              </div>
            </Show>
          </div>
        </Show>

        {/* Form Guide */}
        <Show when={local.formGuide && local.formGuide.length > 0}>
          <div class="space-y-2">
            <div class="text-xs text-muted-foreground font-medium">Last 6 PL matches</div>
            <div class="flex gap-1">
              <For each={local.formGuide?.slice().reverse()}>
                {(result) => (
                  <div class={cn(
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
                    getResultColor(result)
                  )}>
                    {result}
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={local.manager || local.founded}>
          <div class="pt-2 border-t border-border space-y-1">
            <Show when={local.manager}>
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">Manager</span>
                <span class="text-sm font-medium">{local.manager}</span>
              </div>
            </Show>
            <Show when={local.founded}>
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">Founded</span>
                <span class="text-sm font-medium">{local.founded}</span>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={local.position && getPositionLabel(local.position)}>
          <div class="text-center">
            <span class={cn(
              'inline-block px-3 py-1 text-xs font-medium rounded-full',
              getPositionColor(local.position)
            )}>
              {getPositionLabel(local.position)}
            </span>
          </div>
        </Show>
      </CardContent>
    </Card>
  )
}