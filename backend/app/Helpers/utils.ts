export const STANDARD_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss'
export const TIMEZONE_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss ZZ'
export const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

/**
 * An utility function which returns a random number
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {Promise<Number>} Random value
 * @throws {Error}
 */
export const generateCode = function (min: number, max: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!min || !max) reject(new Error('Incomplete parameters'))
    const code = Math.floor(Math.random() * (max - min) + min)
    return resolve(code)
  })
}
