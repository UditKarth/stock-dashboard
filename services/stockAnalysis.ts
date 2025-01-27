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
    macd?: {
      value: number
      signal: number
      histogram: number
    }
    bollingerBands: {
      upper: number
      middle: number
      lower: number
    }
    volumeProfile: {
      volumeChange: number
      volumeStrength: 'high' | 'normal' | 'low'
    }
  }
}

interface MACDResult {
  macd: number[]
  signal: number[]
  histogram: number[]
}

function calculateMACD(prices: number[]): MACDResult {
  // Standard MACD uses 12, 26, and 9 day periods
  const fastEMA = calculateEMA(prices, 12)
  const slowEMA = calculateEMA(prices, 26)
  
  // Calculate MACD line
  const macd = fastEMA.map((fast, i) => fast - slowEMA[i])
  
  // Calculate Signal line (9-day EMA of MACD)
  const signal = calculateEMA(macd, 9)
  
  // Calculate MACD histogram
  const histogram = macd.map((value, i) => value - signal[i])
  
  return { macd, signal, histogram }
}

export async function analyzeStock(stockData: StockData): Promise<StockAnalysis> {
  const historicalPrices = stockData.historicalData.map(d => d.price)
  const historicalVolumes = stockData.historicalData.map(d => d.volume)
  
  const rsi = calculateRSI(historicalPrices)
  const macd = calculateMACD(historicalPrices)
  const bollingerBands = calculateBollingerBands(historicalPrices)
  const volumeProfile = calculateVolumeProfile(historicalPrices, historicalVolumes)
  const shortTermMA = calculateMA(historicalPrices.slice(-20)) 
  const longTermMA = calculateMA(historicalPrices.slice(-50))
  const volatility = calculateVolatility(historicalPrices)

  const currentPrice = historicalPrices[historicalPrices.length - 1]
  const pricePosition = {
    aboveUpperBB: currentPrice > bollingerBands.upper,
    belowLowerBB: currentPrice < bollingerBands.lower,
    nearMA: Math.abs(currentPrice - shortTermMA) / shortTermMA < 0.02
  }

  const recommendation = generateRecommendation({
    rsi,
    macd,
    shortTermMA,
    longTermMA,
    volatility,
    volumeProfile,
    pricePosition,
    bollingerBands,
    currentPrice
  })

  return {
    ...recommendation,
    metrics: {
      rsi,
      movingAverage: { shortTerm: shortTermMA, longTerm: longTermMA },
      volatility,
      macd: {
        value: macd.macd[macd.macd.length - 1],
        signal: macd.signal[macd.signal.length - 1],
        histogram: macd.histogram[macd.histogram.length - 1]
      },
      bollingerBands,
      volumeProfile
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
  // Calculate daily returns
  const returns = prices.slice(1).map((price, i) => 
    (price - prices[i]) / prices[i]
  )
  
  // Calculate mean of returns
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  
  // Calculate standard deviation of returns
  const squaredDiffs = returns.map(ret => 
    Math.pow(ret - meanReturn, 2)
  )
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length
  const stdDev = Math.sqrt(variance)
  
  // Annualize the volatility (multiply by sqrt of trading days in a year)
  const annualizedVol = stdDev * Math.sqrt(252)
  
  return annualizedVol
}

function generateRecommendation({
  rsi,
  macd,
  shortTermMA,
  longTermMA,
  volatility,
  volumeProfile,
  pricePosition,
  bollingerBands,
  currentPrice
}: {
  rsi: number
  macd: MACDResult
  shortTermMA: number
  longTermMA: number
  volatility: number
  volumeProfile: { volumeChange: number; volumeStrength: string }
  pricePosition: { aboveUpperBB: boolean; belowLowerBB: boolean; nearMA: boolean }
  bollingerBands: { upper: number; middle: number; lower: number }
  currentPrice: number
}): Pick<StockAnalysis, 'recommendation' | 'confidence' | 'reasons'> {
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
  const maSpread = ((shortTermMA - longTermMA) / longTermMA) * 100
  if (shortTermMA > longTermMA) {
    reasons.push(`Short-term trend is bullish (${maSpread.toFixed(2)}% above long-term MA)`)
    confidence += Math.min(15, maSpread)
  } else {
    reasons.push(`Short-term trend is bearish (${Math.abs(maSpread).toFixed(2)}% below long-term MA)`)
    confidence -= Math.min(15, Math.abs(maSpread))
  }

  // MACD Analysis
  const currentMACD = macd.macd[macd.macd.length - 1]
  const currentSignal = macd.signal[macd.signal.length - 1]
  const previousHistogram = macd.histogram[macd.histogram.length - 2]
  const currentHistogram = macd.histogram[macd.histogram.length - 1]

  if (currentMACD > currentSignal) {
    reasons.push('MACD above signal line (bullish)')
    confidence += 10
  } else {
    reasons.push('MACD below signal line (bearish)')
    confidence -= 10
  }

  // Normalize confidence
  confidence = Math.max(0, Math.min(100, confidence))
  
  let recommendation: StockAnalysis['recommendation']
  if (confidence >= 60) {
    recommendation = 'Buy'
  } else if (confidence <= 40) {
    recommendation = 'Sell'
  } else {
    recommendation = 'Hold'
  }

  return { recommendation, confidence, reasons }
}

function calculateVolumeProfile(prices: number[], volumes: number[]): {
  volumeChange: number
  volumeStrength: 'high' | 'normal' | 'low'
} {
  const avgVolume = volumes.slice(-10).reduce((sum, vol) => sum + vol, 0) / 10
  const currentVolume = volumes[volumes.length - 1]
  const volumeChange = ((currentVolume - avgVolume) / avgVolume) * 100
  
  return {
    volumeChange,
    volumeStrength: 
      volumeChange > 50 ? 'high' :
      volumeChange < -50 ? 'low' : 'normal'
  }
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateMA(prices.slice(-period))
  const variance = prices.slice(-period)
    .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
  const std = Math.sqrt(variance)
  
  return {
    upper: sma + (stdDev * std),
    middle: sma,
    lower: sma - (stdDev * std)
  }
}

function calculateRSITrend(rsiValues: number[]): 'rising' | 'falling' | 'neutral' {
  if (rsiValues.length < 2) return 'neutral'
  
  const changes = rsiValues.slice(1).map((value, i) => value - rsiValues[i])
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  
  if (avgChange > 1) return 'rising'
  if (avgChange < -1) return 'falling'
  return 'neutral'
} 