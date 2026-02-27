import { useGameState } from '../hooks/useGameSelectors'

export default function RoundResults() {
  const { results } = useGameState()

  if (!results) return null
  
  return (
    <div className="my-8 animate-[fadeIn_0.5s]">
      <h2 className="text-[#6C5B7B] text-center mb-8 font-bold text-[2rem]">
        🎉 Round {results.round_number} Results! 🎉
      </h2>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-[20px] mb-8 shadow-[0_4px_16px_rgba(76,175,80,0.2)]">
        <h3 className="m-0 mb-4 text-green-800 text-xl">The Answer:</h3>
        <div className="bg-white p-6 rounded-xl font-mono text-sm text-green-800 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
          {JSON.stringify(results.correct_answer, null, 2)}
        </div>
      </div>

      <div>
        <h3 className="text-[#6C5B7B] mb-6 font-bold">Player Results:</h3>
        {results.results.map((result, idx) => (
          <div key={idx} className="bg-white border-[3px] border-gray-200 rounded-[20px] p-6 mb-5 transition-all duration-300 animate-[slideInLeft_0.3s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-5 pb-5 border-b-2 border-gray-200">
              <span className="text-xl font-bold text-[#6C5B7B]">{result.name}</span>
              <span className="text-lg font-bold text-green-500 bg-gradient-to-br from-green-100 to-green-200 py-2 px-4 rounded-xl">
                +{result.points_earned.toFixed(1)} pts (Total: {result.total_score.toFixed(1)})
              </span>
            </div>
            <div>
              {result.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
