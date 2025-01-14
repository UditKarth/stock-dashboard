export async function fetchStockData(symbol: string): Promise<StockData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate mock historical data
  const historicalData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (30 - i))
    
    return {
      timestamp: date.getTime(),
      price: 100 + Math.random() * 50 * Math.sin(i / 5)
    }
  })

  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corp`,
    price: historicalData[historicalData.length - 1].price,
    change: 2.5,
    changePercent: 2.1,
    historicalData
  }
}

export async function searchStocks(query: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock stock symbols
  const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA']
  return stocks.filter(stock => stock.toLowerCase().includes(query.toLowerCase()))
}

