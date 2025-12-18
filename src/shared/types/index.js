/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} hint
 */

/**
 * @typedef {Object} Pro
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string[]} categories
 * @property {string} region
 * @property {string[]} tags
 * @property {number} rating
 * @property {number} reviewCount
 * @property {boolean} verified
 * @property {number} responseRate
 * @property {number} responseTimeMin
 * @property {number} minPrice
 * @property {string} bio
 * @property {string[]} highlights
 */

/**
 * @typedef {Object} Request
 * @property {string} id
 * @property {string} categoryId
 * @property {string} description
 * @property {string} region
 * @property {string} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} threadId
 * @property {string} from
 * @property {string} text
 * @property {string} createdAt
 */
