// src/utils/hash.ts

// FNV-1a 32-bit (fast, non-crypto) — good enough for dedupe fingerprints.

/**
 * Generates a fast, non-cryptographic 32-bit FNV-1a hash for a given string.
 *
 * This function is suitable for deduplication fingerprints and error signatures,
 * but should NOT be used for security or cryptographic purposes.
 *
 * FNV-1a is chosen for its speed and good distribution for short strings.
 *
 * @param {string} input - The input string to hash.
 * @returns {string} The 32-bit hash as a hexadecimal string.
 *
 * @example
 *   const hash = simpleHash('example');
 *   // hash => 'b7e23ecb'
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
