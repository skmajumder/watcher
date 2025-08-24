/**
 * Watcher SDK - Hash Utilities
 *
 * This file contains hash functions for the Watcher SDK, specifically
 * implementing the FNV-1a algorithm for fast, non-cryptographic hashing.
 * These functions are used for error fingerprinting and deduplication.
 *
 * **Purpose:**
 * Hash functions in the Watcher SDK are used for:
 * - Error fingerprinting and deduplication
 * - Cache key generation
 * - Quick string comparison
 * - Error correlation across systems
 *
 * **Security Note:**
 * These are NOT cryptographic hash functions and should never be used
 * for security purposes, authentication, or data integrity verification.
 */

/**
 * Generates a fast, non-cryptographic 32-bit FNV-1a hash for a given string
 *
 * This function implements the FNV-1a hash algorithm, which is chosen for its:
 * - **Speed**: Very fast computation suitable for real-time error processing
 * - **Distribution**: Good hash distribution for short strings (error messages)
 * - **Simplicity**: Simple implementation with minimal overhead
 * - **Reliability**: Deterministic output for identical inputs
 *
 * **Algorithm Details:**
 * - **FNV-1a**: Fowler-Noll-Vo hash function variant
 * - **32-bit**: 32-bit hash output for memory efficiency
 * - **Prime**: Uses FNV prime (0x01000193) for good distribution
 * - **Offset**: Uses FNV offset basis (0x811c9dc5) for initialization
 *
 * **Use Cases in Watcher SDK:**
 * - **Error Fingerprinting**: Create unique identifiers for error deduplication
 * - **Cache Keys**: Generate keys for error payload caching
 * - **String Comparison**: Quick comparison of error characteristics
 * - **Cross-System Correlation**: Enable error tracking across different systems
 *
 * @param {string} input - The input string to hash
 * @returns {string} The 32-bit hash as a hexadecimal string
 *
 * @example
 * ```typescript
 * import { simpleHash } from 'watcher';
 *
 * // Hash an error message
 * const hash1 = simpleHash('TypeError: Cannot read property of undefined');
 * console.log(hash1); // 'a1b2c3d4'
 *
 * // Same input produces same hash
 * const hash2 = simpleHash('TypeError: Cannot read property of undefined');
 * console.log(hash1 === hash2); // true
 *
 * // Different inputs produce different hashes
 * const hash3 = simpleHash('ReferenceError: x is not defined');
 * console.log(hash1 === hash3); // false
 * ```
 *
 * **Security Note:**
 * This is NOT a cryptographic hash function. For security purposes,
 * use crypto.createHash() or similar cryptographic functions.
 *
 * @since 0.1.0
 * @version Milestone 1.2
 */
export const simpleHash = (input: string): string => {
  // FNV-1a 32-bit offset basis
  let hash = 0x811c9dc5 >>> 0;
  const inputLength = input.length;

  // Process each character in the input string
  for (let i = 0; i < inputLength; i++) {
    // XOR the hash with the current character code
    hash ^= input.charCodeAt(i);
    // Multiply by the FNV prime (using Math.imul for 32-bit integer multiplication)
    hash = Math.imul(hash, 0x01000193);
  }

  // Convert the final hash to an unsigned 32-bit hex string
  return (hash >>> 0).toString(16);
};
