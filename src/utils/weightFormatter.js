export const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export const tonsToKg = (tons) => toNumber(tons) * 1000

export const formatKg = (tons, options = {}) => {
  const digits = options.maximumFractionDigits ?? 0
  return tonsToKg(tons).toLocaleString(undefined, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: digits
  })
}

export const formatKgWithUnit = (tons, options) => `${formatKg(tons, options)} كجم`

export const formatPricePerKg = (pricePerTon) => (toNumber(pricePerTon) / 1000).toLocaleString(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
})