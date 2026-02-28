import { BreedGuess } from '../types/game'

const COLORS = [
  '#a78bfa', '#818cf8', '#67e8f9', '#fbbf24',
  '#f472b6', '#34d399', '#fb923c', '#c084fc',
]

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

interface BreedPieChartProps {
  breeds: BreedGuess[]
}

export default function BreedPieChart({ breeds }: BreedPieChartProps) {
  const nonZero = breeds.filter(b => b.percentage > 0)
  const total = nonZero.reduce((sum, b) => sum + b.percentage, 0)

  let angle = 0
  const slices = nonZero.map((breed, i) => {
    const sweep = (breed.percentage / total) * 360
    const startAngle = angle
    angle += sweep
    return { breed, startAngle, endAngle: angle, color: COLORS[i % COLORS.length] }
  })

  return (
    <div className="flex flex-col items-center gap-4 md:gap-5">
      <svg viewBox="0 0 200 200" className="w-72 h-72 md:w-80 md:h-80">
        {slices.length === 1 ? (
          <circle
            cx={100} cy={100} r={80}
            fill={slices[0].color}
            stroke="white" strokeWidth={2}
            className="animate-fade-in"
          />
        ) : (
          slices.map((s, i) => (
            <path
              key={s.breed.name}
              d={describeArc(100, 100, 80, s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="white"
              strokeWidth={2}
              className="animate-fade-in opacity-0 [animation-fill-mode:forwards]"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))
        )}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {nonZero.map((breed, i) => (
          <div key={breed.name} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-sm md:text-base font-semibold text-emerald-900">
              {breed.name}: {breed.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
