"use client"

import { useState } from "react"
import { Search, CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StockCard } from "@/components/stock-card"
import { MarketIndices } from "@/components/market-indices"
import { searchStocks } from "@/services/stockApi"
import type { StockEntry } from "@/types/stock"

export default function StockDashboard() {
  const [open, setOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [stocks, setStocks] = useState<StockEntry[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")
  const [shareInput, setShareInput] = useState<string>("")
  const [purchaseDate, setPurchaseDate] = useState<Date>()

  const handleSearch = async (query: string) => {
    if (query.length > 0) {
      const results = await searchStocks(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol)
    setOpen(false)
  }

  const handleSubmit = () => {
    if (selectedSymbol && !stocks.some((s) => s.symbol === selectedSymbol)) {
      const shares = shareInput ? parseInt(shareInput, 10) : undefined
      setStocks([...stocks, { 
        symbol: selectedSymbol, 
        shares,
        purchaseDate 
      }])
      setSelectedSymbol("")
      setShareInput("")
      setPurchaseDate(undefined)
    }
  }

  const removeStock = (symbol: string) => {
    setStocks(stocks.filter((s) => s.symbol !== symbol))
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <MarketIndices />

      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full sm:w-[200px] justify-between"
            >
              <Search className="mr-2 h-4 w-4" />
              {selectedSymbol || "Add Stock"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput
                placeholder="Search stocks..."
                onValueChange={handleSearch}
              />
              <CommandList>
                <CommandEmpty>No stocks found.</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((symbol) => (
                    <CommandItem
                      key={symbol}
                      onSelect={() => handleSymbolSelect(symbol)}
                    >
                      {symbol}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          type="number"
          placeholder="Number of shares (optional)"
          value={shareInput}
          onChange={(e) => setShareInput(e.target.value)}
          className="w-full sm:w-[200px]"
        />

        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[200px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {purchaseDate ? format(purchaseDate, "PPP") : "Purchase date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={purchaseDate}
              onSelect={(date) => {
                setPurchaseDate(date)
                setDateOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button 
          onClick={handleSubmit}
          disabled={!selectedSymbol}
          className="w-full sm:w-auto"
        >
          Add to Dashboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => (
          <StockCard
            key={stock.symbol}
            symbol={stock.symbol}
            shares={stock.shares}
            purchaseDate={stock.purchaseDate}
            onRemove={removeStock}
          />
        ))}
      </div>

      {stocks.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Add stocks to start tracking them
        </div>
      )}
    </div>
  )
}

