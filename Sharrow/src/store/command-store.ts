import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CommandGroup } from '@/components/shell/commands'

export interface RecentCommand {
  id: string
  group: CommandGroup
  title: string
  subtitle?: string
  route?: string
}

interface CommandStore {
  recents: RecentCommand[]
  pushRecent: (cmd: RecentCommand) => void
}

const MAX_RECENTS = 6

export const useCommandStore = create<CommandStore>()(
  persist(
    (set) => ({
      recents: [],
      pushRecent: (cmd) =>
        set((s) => ({
          recents: [cmd, ...s.recents.filter((r) => r.id !== cmd.id)].slice(0, MAX_RECENTS),
        })),
    }),
    { name: 'sharrow-recents' },
  ),
)
