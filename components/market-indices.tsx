"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

export function MarketIndices() {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "NASDAQ", value: 0, change: 0, changePercent: 0 },
    { name: "S&P 500", value: 0, change: 0, changePercent: 0 },
    { name: "Dow Jones", value: 0, change: 0, changePercent: 0 }
  ])

  useEffect(() => {
    const fetchIndices = async () => {
      // Mock data - replace with actual API call
      const mockIndices: MarketIndex[] = [
        { name: "NASDAQ", value: 14892.45, change: 145.23, changePercent: 0.98 },
        { name: "S&P 500", value: 4783.35, change: 32.45, changePercent: 0.68 },
        { name: "Dow Jones", value: 37468.61, change: -23.45, changePercent: -0.06 }
      ]
      setIndices(mockIndices)
    }

    fetchIndices()
    const interval = setInterval(fetchIndices, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {indices.map((index) => (
        <Card key={index.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{index.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
              <div
                className={`flex items-center space-x-2 ${
                  index.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {index.change >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span>
                  {index.change >= 0 ? "+" : ""}
                  {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

