export type DiscountType = 'percent' | 'fixed'

export type PhotonDiscountCode = {
  code: string
  type: DiscountType
  value: number
  active: boolean
  note?: string
}

export const DEFAULT_DISCOUNT_CODES: PhotonDiscountCode[] = [
  {
    code: 'PHOTON10',
    type: 'percent',
    value: 10,
    active: true,
    note: '10% off merchandise subtotal',
  },
  {
    code: 'SAVE500',
    type: 'fixed',
    value: 500,
    active: true,
    note: 'KES 500 off merchandise subtotal',
  },
]

export function normalizeDiscountCodes(raw: unknown): PhotonDiscountCode[] {
  if (!Array.isArray(raw) || !raw.length) return DEFAULT_DISCOUNT_CODES
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const code = String(item.code || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
      const type: DiscountType = item.type === 'fixed' ? 'fixed' : 'percent'
      const value = Math.max(0, Number(item.value) || 0)
      return {
        code,
        type,
        value: type === 'percent' ? Math.min(100, value) : value,
        active: item.active !== false,
        note: typeof item.note === 'string' ? item.note : undefined,
      }
    })
    .filter((d) => d.code && d.value > 0)
}

export function findDiscountCode(
  codes: PhotonDiscountCode[],
  codeRaw: string
): PhotonDiscountCode | null {
  const needle = codeRaw.trim().toUpperCase().replace(/\s+/g, '')
  if (!needle) return null
  return codes.find((c) => c.active && c.code === needle) || null
}

export function discountAmountOff(
  discount: PhotonDiscountCode,
  subtotal: number
): number {
  const base = Math.max(0, Number(subtotal) || 0)
  if (!base) return 0
  if (discount.type === 'percent') {
    return Math.min(base, Math.round((base * discount.value) / 100))
  }
  return Math.min(base, Math.round(discount.value))
}
