import { useGameState } from '../hooks/useGameSelectors'

interface HeaderProps {
  isAdmin?: boolean
}

export default function Header({ isAdmin }: HeaderProps) {
  const { config, currentRound, playerName } = useGameState()

  if (!config) return null

  return (
    <div className="mb-3 md:mb-5 bg-white/95 backdrop-blur-sm py-3 px-4 md:py-4 md:px-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-2 md:gap-4">
      <h1 className="m-0 bg-linear-to-br from-bubble to-bubble-deep bg-clip-text text-transparent text-lg md:text-2xl font-bold tracking-tight">
        {config.title}
      </h1>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-sm md:text-base font-semibold text-slate-600 bg-linear-to-br from-violet-100 to-indigo-100 py-1.5 px-3 md:py-2 md:px-5 rounded-xl">
          {currentRound !== null ? currentRound + 1 : 0}/{config.total_rounds}
        </div>

        {isAdmin ? (
          <span className="py-1.5 px-3 md:py-2 md:px-4 bg-linear-to-br from-violet-500 to-indigo-600 text-white font-bold text-xs md:text-sm rounded-xl uppercase tracking-wider">
            Host
          </span>
        ) : (
          <span className="text-sm md:text-base text-slate-600 font-semibold">
            {playerName}
          </span>
        )}
      </div>
    </div>
  )
}
