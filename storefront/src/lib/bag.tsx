"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BagLine = {
  productId: string
  productHandle: string
  title: string
  variantId: string
  variantTitle: string
  thumbnail?: string | null
  unitPrice: number
  currency: string
  quantity: number
}

type BagContextValue = {
  lines: BagLine[]
  count: number
  subtotal: number
  currency: string
  ready: boolean
  addItem: (line: Omit<BagLine, "quantity"> & { quantity?: number }) => void
  setQuantity: (variantId: string, quantity: number) => void
  removeItem: (variantId: string) => void
  clear: () => void
}

const STORAGE_KEY = "photon-bag-v1"
const BagContext = createContext<BagContextValue | null>(null)

function load(): BagLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(load())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const addItem = useCallback(
    (line: Omit<BagLine, "quantity"> & { quantity?: number }) => {
      const qty = line.quantity ?? 1
      setLines((prev) => {
        const existing = prev.find((l) => l.variantId === line.variantId)
        if (existing) {
          return prev.map((l) =>
            l.variantId === line.variantId
              ? { ...l, quantity: l.quantity + qty }
              : l
          )
        }
        return [...prev, { ...line, quantity: qty }]
      })
    },
    []
  )

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.variantId !== variantId)
      return prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  )

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines]
  )

  const currency = lines[0]?.currency ?? "kes"

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      currency,
      ready,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [lines, count, subtotal, currency, ready, addItem, setQuantity, removeItem, clear]
  )

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>
}

export function useBag() {
  const ctx = useContext(BagContext)
  if (!ctx) throw new Error("useBag must be used within BagProvider")
  return ctx
}
