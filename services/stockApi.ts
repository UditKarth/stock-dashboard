import { FINNHUB_API_KEY } from "@/lib/config"

export async function fetchStockData(symbol: string): Promise<StockData> {
  try {
    // Fetch current quote data
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    )
    
    if (!quoteResponse.ok) {
      throw new Error('Failed to fetch quote data')
    }
    
    const quoteData = await quoteResponse.json()

    // Fetch company profile for the name
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    )
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch company profile')
    }
    
    const profileData = await profileResponse.json()

    // Generate mock historical data since we can't access the real data
    const historicalData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (30 - i))
      
      // Use the current price as a base and add some random variation
      const basePrice = quoteData.c || 100
      const randomVariation = (Math.random() - 0.5) * 5 // ±2.5% variation
      const price = basePrice * (1 + randomVariation / 100)
      
      return {
        timestamp: date.getTime(),
        price: price
      }
    })

    return {
      symbol: symbol,
      name: profileData.name || symbol,
      price: quoteData.c,
      change: quoteData.d,
      changePercent: quoteData.dp,
      historicalData
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
    throw error
  }
}

export async function searchStocks(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch search results')
    }
    
    const data = await response.json()
    
    // Extract and return just the symbols from the search results
    return data.result
      .map((item: any) => item.symbol)
      .filter((symbol: string) => symbol.length > 0)
      .slice(0, 10) // Limit to 10 results
  } catch (error) {
    console.error('Error searching stocks:', error)
    throw error
  }
}

