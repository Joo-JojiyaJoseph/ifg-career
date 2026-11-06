/** Drop empty values so query strings stay short and cache keys stable. */
export function compact(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}
