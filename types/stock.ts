export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  historicalData: {
    timestamp: number
    price: number
  }[]
}

export interface StockEntry {
  symbol: string
  shares?: number
  purchaseDate?: Date
}

export interface StockCardProps {
  symbol: string
  shares?: number
  purchaseDate?: Date
  onRemove: (symbol: string) => void
}

