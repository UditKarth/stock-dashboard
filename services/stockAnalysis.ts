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

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    throw new Error(`Need at least ${period + 1} prices to calculate RSI`)
  }

  // Step 1: Calculate price changes
  const changes = prices.slice(1).map((price, index) => price - prices[index])
  
  // Step 2: Split into gains and losses
  const gains = changes.map(change => change > 0 ? change : 0)
  const losses = changes.map(change => change < 0 ? -change : 0)
  
  // Step 3: Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain) / period
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss) / period
  
  // Step 4: Calculate smoothed averages using EMA
  const smoothingFactor = 2 / (period + 1)
  const rsiValues = []
  
  for (let i = period; i < changes.length; i++) {
    // Update averages using EMA formula
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    
    // Calculate RS and RSI
    const rs = avgGain / (avgLoss || 1e-10) // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs))
    rsiValues.push(rsi)
  }
  
  // Return the most recent RSI value
  return rsiValues[rsiValues.length - 1]
}

// Helper function to calculate Exponential Moving Average
function calculateEMA(prices: number[], period: number): number[] {
  const multiplier = 2 / (period + 1)
  const ema = [prices[0]] // First EMA is same as first price
  
  for (let i = 1; i < prices.length; i++) {
    ema.push(
      (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
    )
  }
  
  return ema
}

function calculateMA(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length
}

function calculateVolatility(prices: number[]): number {
  const mean = calculateMA(prices)
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2))
  return Math.sqrt(calculateMA(squaredDiffs))
}

// Enhanced version of generateRecommendation that uses RSI trends
function generateRecommendation(
  rsi: number,
  shortTermMA: number,
  longTermMA: number,
  volatility: number,
  historicalRSI?: number[] // Add historical RSI values
): Pick<StockAnalysis, 'recommendation' | 'confidence' | 'reasons'> {
  const reasons: string[] = []
  let confidence = 50
  
  // RSI Analysis with trend
  if (rsi > 70) {
    reasons.push('RSI indicates overbought conditions')
    confidence -= 20
    
    // Check if RSI is falling from overbought
    if (historicalRSI && historicalRSI[historicalRSI.length - 2] > rsi) {
      reasons.push('RSI showing bearish divergence')
      confidence -= 10
    }
  } else if (rsi < 30) {
    reasons.push('RSI indicates oversold conditions')
    confidence += 20
    
    // Check if RSI is rising from oversold
    if (historicalRSI && historicalRSI[historicalRSI.length - 2] < rsi) {
      reasons.push('RSI showing bullish convergence')
      confidence += 10
    }
  }
  
  // RSI trend analysis
  if (historicalRSI && historicalRSI.length >= 3) {
    const rsiTrend = calculateRSITrend(historicalRSI.slice(-3))
    if (rsiTrend === 'rising') {
      reasons.push('RSI showing upward momentum')
      confidence += 5
    } else if (rsiTrend === 'falling') {
      reasons.push('RSI showing downward momentum')
      confidence -= 5
    }
  }
  
  // Moving Average Analysis with confirmation
  const maSpread = ((shortTermMA - longTermMA) / longTermMA) * 100
  if (shortTermMA > longTermMA) {
    reasons.push(`Short-term trend is bullish (${maSpread.toFixed(2)}% above long-term MA)`)
    confidence += Math.min(15, maSpread) // Cap the confidence boost
  } else {
    reasons.push(`Short-term trend is bearish (${Math.abs(maSpread).toFixed(2)}% below long-term MA)`)
    confidence -= Math.min(15, Math.abs(maSpread))
  }
  
  // Volatility Analysis with context
  const volatilityThreshold = 0.2
  if (volatility > volatilityThreshold) {
    const volatilityPercentage = ((volatility - volatilityThreshold) / volatilityThreshold) * 100
    reasons.push(`High volatility detected (${volatilityPercentage.toFixed(2)}% above normal)`)
    confidence -= Math.min(10, volatilityPercentage / 10)
  }
  
  // Normalize confidence between 0 and 100
  confidence = Math.max(0, Math.min(100, confidence))
  
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

// Helper function to determine RSI trend
function calculateRSITrend(rsiValues: number[]): 'rising' | 'falling' | 'neutral' {
  if (rsiValues.length < 2) return 'neutral'
  
  const changes = rsiValues.slice(1).map((value, i) => value - rsiValues[i])
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  
  if (avgChange > 1) return 'rising'
  if (avgChange < -1) return 'falling'
  return 'neutral'
} 