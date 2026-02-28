import { useGameState } from '../hooks/useGameSelectors'
import { CorrectAnswer } from '../types/game'

function formatAnswer(answer: CorrectAnswer): string {
  switch (answer.type) {
    case 'breed_percentage':
      return answer.breeds
        .map(b => `${b.name}: ${b.percentage}%`)
        .join('\n')
    case 'numeric':
      return `${answer.value}`
    case 'multi_select':
      return answer.selections.join(', ')
    case 'multiple_choice':
      return answer.selection
  }
}

export default function RoundResults() {
  const { results, roundData } = useGameState()

  if (!results) return null

  return (
    <div className="my-6 md:my-8 animate-fade-in">
      <h2 className="text-slate-600 text-center mb-6 md:mb-8 font-bold text-xl md:text-2xl lg:text-[2rem]">
        🎉 Round {results.round_number + 1} Results! 🎉
      </h2>

      {roundData && (
        <div className="bg-linear-to-br from-violet-50 to-indigo-100 p-4 md:p-6 rounded-2xl md:rounded-[20px] mb-6 md:mb-8 shadow-md">
          <h3 className="m-0 mb-2 text-indigo-800 text-lg md:text-xl font-bold">{roundData.title}</h3>
          <p className="m-0 text-indigo-700 text-base md:text-lg">{roundData.question}</p>
        </div>
      )}

      <div className="bg-linear-to-br from-emerald-50 to-emerald-100 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[20px] mb-6 md:mb-8 shadow-md md:shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
        <h3 className="m-0 mb-3 md:mb-4 text-emerald-800 text-lg md:text-xl font-bold">The Answer:</h3>
        <div className="bg-white p-4 md:p-6 rounded-xl text-base md:text-lg text-emerald-900 whitespace-pre-wrap font-semibold">
          {formatAnswer(results.correct_answer)}
        </div>
      </div>

      <div>
        <h3 className="text-slate-600 mb-4 md:mb-6 font-bold text-lg md:text-xl">Player Results:</h3>
        {results.results.map((result, idx) => (
          <div key={idx} className="bg-white border-[3px] border-gray-200 rounded-2xl md:rounded-[20px] p-4 md:p-6 mb-4 md:mb-5 transition-all duration-300 animate-slide-in-left active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-5 pb-4 md:pb-5 border-b-2 border-gray-200 gap-2">
              <span className="text-lg md:text-xl font-bold text-slate-600">{result.name}</span>
              <span className="text-base md:text-lg font-bold text-emerald-500 bg-linear-to-br from-emerald-100 to-emerald-200 py-2 px-4 rounded-xl text-center">
                +{result.points_earned.toFixed(1)} pts (Total: {result.total_score.toFixed(1)})
              </span>
            </div>
            <div className="text-sm md:text-base">
              {result.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
