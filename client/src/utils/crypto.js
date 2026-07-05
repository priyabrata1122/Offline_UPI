/**
 * Converts a base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Imports a PEM formatted public key into a Web Crypto CryptoKey object.
 */
async function importPublicKey(pem) {
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  
  let cleanPem = pem.replace(pemHeader, '').replace(pemFooter, '');
  cleanPem = cleanPem.replace(/\s+/g, '');
  
  const derBuffer = base64ToArrayBuffer(cleanPem);
  
  return await window.crypto.subtle.importKey(
    'spki',
    derBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Client-side implementation of the hybrid encryption protocol.
 */
export async function encryptInstruction(instruction, serverPublicKeyPem) {
  const plaintext = new TextEncoder().encode(JSON.stringify(instruction));

  // 1. Import RSA Server Public Key
  const rsaKey = await importPublicKey(serverPublicKeyPem);

  // 2. Generate a random 256-bit AES key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']
  );

  // 3. Generate random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 4. Encrypt payload with AES-256-GCM
  const aesCiphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    plaintext
  );

  // 5. Encrypt the raw AES key with RSA-OAEP
  const rawAesKeyBytes = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    rsaKey,
    rawAesKeyBytes
  );

  // 6. Pack into byte array
  const packedLength = encryptedAesKeyBuffer.byteLength + iv.byteLength + aesCiphertextBuffer.byteLength;
  const packedBytes = new Uint8Array(packedLength);

  packedBytes.set(new Uint8Array(encryptedAesKeyBuffer), 0);
  packedBytes.set(iv, encryptedAesKeyBuffer.byteLength);
  packedBytes.set(new Uint8Array(aesCiphertextBuffer), encryptedAesKeyBuffer.byteLength + iv.byteLength);

  return arrayBufferToBase64(packedBytes.buffer);
}

/**
 * Generates a SHA-256 hex string of the ciphertext.
 */
export async function hashCiphertext(base64Ciphertext) {
  const msgUint8 = new TextEncoder().encode(base64Ciphertext);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
