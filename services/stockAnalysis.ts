import { StockData } from "@/types/stock"

interface StockAnalysis {
  recommendation: 'Buy' | 'Sell' | 'Hold'
  confidence: number // 0-100
  reasons: string[]
  metrics: {
    rsi: number
    movingAverage: {
      shortTerm: number
      longTerm: number
    }
    volatility: number
  }
}

export async function analyzeStock(stockData: StockData): Promise<StockAnalysis> {
  const historicalPrices = stockData.historicalData.map(d => d.price)
  
  // Calculate RSI (Relative Strength Index)
  const rsi = calculateRSI(historicalPrices)
  
  // Calculate Moving Averages
  const shortTermMA = calculateMA(historicalPrices.slice(-7)) // 7-day MA
  const longTermMA = calculateMA(historicalPrices.slice(-30)) // 30-day MA
  
  // Calculate Volatility
  const volatility = calculateVolatility(historicalPrices)
  
  // Generate recommendation
  const recommendation = generateRecommendation(rsi, shortTermMA, longTermMA, volatility)
  
  return {
    ...recommendation,
    metrics: {
      rsi,
      movingAverage: {
        shortTerm: shortTermMA,
        longTerm: longTermMA
      },
      volatility
    }
  }
}

function calculateRSI(prices: number[]): number {
  // Basic RSI calculation
  const gains = []
  const losses = []
  
  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1]
    if (difference >= 0) {
      gains.push(difference)
      losses.push(0)
    } else {
      gains.push(0)
      losses.push(Math.abs(difference))
    }
  }
  
  const avgGain = calculateMA(gains)
  const avgLoss = calculateMA(losses)
  
  const rs = avgGain / (avgLoss || 1)
  return 100 - (100 / (1 + rs))
}

function calculateMA(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length
}

function calculateVolatility(prices: number[]): number {
  const mean = calculateMA(prices)
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2))
  return Math.sqrt(calculateMA(squaredDiffs))
}

function generateRecommendation(
  rsi: number,
  shortTermMA: number,
  longTermMA: number,
  volatility: number
): Pick<StockAnalysis, 'recommendation' | 'confidence' | 'reasons'> {
  const reasons: string[] = []
  let confidence = 50
  
  // RSI Analysis
  if (rsi > 70) {
    reasons.push('RSI indicates overbought conditions')
    confidence -= 20
  } else if (rsi < 30) {
    reasons.push('RSI indicates oversold conditions')
    confidence += 20
  }
  
  // Moving Average Analysis
  if (shortTermMA > longTermMA) {
    reasons.push('Short-term trend is bullish')
    confidence += 15
  } else {
    reasons.push('Short-term trend is bearish')
    confidence -= 15
  }
  
  // Volatility Analysis
  if (volatility > 0.2) {
    reasons.push('High volatility detected')
    confidence -= 10
  }
  
  let recommendation: StockAnalysis['recommendation']
  if (confidence >= 60) {
    recommendation = 'Buy'
  } else if (confidence <= 40) {
    recommendation = 'Sell'
  } else {
    recommendation = 'Hold'
  }
  
  return {
    recommendation,
    confidence,
    reasons
  }
} 