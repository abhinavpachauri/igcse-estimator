/**
 * UMS (Uniform Mark Scale) conversion utilities.
 *
 * For the current 17 supported subjects, none use UMS — Cambridge IGCSE has
 * moved to raw mark grading. This module is included for forward compatibility
 * if UMS subjects are added in the future.
 *
 * When a subject paper has is_ums = true, the raw mark should be converted
 * to a UMS mark before being used in the weighted calculation. UMS conversion
 * tables are published by Cambridge per paper per series and would need to be
 * stored in the database and looked up here.
 */

export interface UmsConversionPoint {
  raw_mark: number
  ums_mark: number
}

/**
 * Converts a raw mark to a UMS mark using linear interpolation
 * between the provided conversion table points.
 *
 * @param rawMark - The raw mark to convert
 * @param conversionTable - Array of { raw_mark, ums_mark } points, sorted by raw_mark ascending
 * @returns The UMS mark
 */
export function convertRawToUms(
  rawMark: number,
  conversionTable: UmsConversionPoint[]
): number {
  if (conversionTable.length === 0) return rawMark

  const sorted = [...conversionTable].sort((a, b) => a.raw_mark - b.raw_mark)

  // Below minimum
  if (rawMark <= sorted[0].raw_mark) return sorted[0].ums_mark

  // Above maximum
  const last = sorted[sorted.length - 1]
  if (rawMark >= last.raw_mark) return last.ums_mark

  // Linear interpolation between adjacent points
  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i]
    const upper = sorted[i + 1]

    if (rawMark >= lower.raw_mark && rawMark <= upper.raw_mark) {
      const fraction = (rawMark - lower.raw_mark) / (upper.raw_mark - lower.raw_mark)
      return Math.round(lower.ums_mark + fraction * (upper.ums_mark - lower.ums_mark))
    }
  }

  return rawMark
}
