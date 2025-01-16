import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { StockData } from "@/types/stock"
import { analyzeStock } from "@/services/stockAnalysis"
import { useEffect, useState } from "react"

interface StockAnalysisProps {
  stockData: StockData
}

export function StockAnalysis({ stockData }: StockAnalysisProps) {
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyzeStock>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const performAnalysis = async () => {
      setLoading(true)
      const result = await analyzeStock(stockData)
      setAnalysis(result)
      setLoading(false)
    }

    performAnalysis()
  }, [stockData])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Analysis & Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${
            analysis.recommendation === 'Buy' ? 'text-green-600' :
            analysis.recommendation === 'Sell' ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {analysis.recommendation}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <Progress value={analysis.confidence} className="w-24" />
            <span className="text-sm">{analysis.confidence}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Analysis</h4>
          <ul className="text-sm space-y-1">
            {analysis.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">RSI</div>
            <div className="font-medium">{analysis.metrics.rsi.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">7-Day MA</div>
            <div className="font-medium">${analysis.metrics.movingAverage.shortTerm.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">30-Day MA</div>
            <div className="font-medium">${analysis.metrics.movingAverage.longTerm.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 