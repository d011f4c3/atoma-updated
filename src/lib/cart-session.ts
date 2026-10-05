import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const CART_SESSION_SECRET_ENV = "JMM_CART_SESSION_SECRET" as const;
const DEVELOPMENT_CART_SESSION_COOKIE_NAME = "atoma_v3_cart_session" as const;
const PRODUCTION_CART_SESSION_COOKIE_NAME =
  "__Host-atoma_v3_cart_session" as const;

const SESSION_VERSION = "v1";
const SESSION_PURPOSE = "jmm.cart-reference";
const ACTION_KEY_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MAX_SESSION_ENVELOPE_LENGTH = 3 * 1_024;
const MAX_SESSION_PLAINTEXT_BYTES = 2 * 1_024;
const MAX_OPAQUE_REFERENCE_UTF8_BYTES = 960;
const HKDF_SALT = Buffer.from("jmm.cart-crypto.master.v1", "utf8");
const AEAD_KEY_INFO = Buffer.from("jmm.cart-session.aead.v1", "utf8");
const ACTION_KEY_INFO = Buffer.from("jmm.cart-action-key.hmac.v1", "utf8");
const STORE_DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/;
const CANONICAL_SECRET_PATTERN = /^[A-Za-z0-9+/]{43}=$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const ACTION_KEY_PATTERN = /^v1_[A-Za-z0-9_-]{43}$/;
const OPAQUE_REFERENCE_DISALLOWED_PATTERN = /[\s\u0000-\u001f\u007f-\u009f]/;

declare const cartSessionSecretBrand: unique symbol;

export type CartSessionSecret = Readonly<{
  [cartSessionSecretBrand]: "CartSessionSecret";
}>;

declare const cartActionKeyBrand: unique symbol;

export type CartActionKey = string & {
  readonly [cartActionKeyBrand]: "CartActionKey";
};

export type CartActionKind =
  "product_variant" | "product_subscription" | "cart_line";

export interface CartActionKeyInput {
  readonly kind: CartActionKind;
  readonly reference: string;
  readonly storeDomain: string;
}

export interface CartSessionInput {
  readonly cartReference: string;
  readonly storeDomain: string;
  readonly sellingPlansEnabled?: boolean;
}

export interface CartSessionOpenOptions {
  readonly storeDomain: string;
  readonly secret: CartSessionSecret;
  readonly sellingPlansEnabled?: boolean;
}

export interface CartSessionCookieOptions {
  readonly httpOnly: true;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly secure: boolean;
}

export type CartSessionEnvironment = Readonly<
  Record<string, string | undefined>
>;

const secretKeys = new WeakMap<object, Buffer>();

export function readCartSessionSecret(
  environment: CartSessionEnvironment = process.env,
): CartSessionSecret {
  try {
    const encoded = environment[CART_SESSION_SECRET_ENV];

    if (
      typeof encoded !== "string" ||
      !CANONICAL_SECRET_PATTERN.test(encoded)
    ) {
      throw new Error();
    }

    const key = Buffer.from(encoded, "base64");
    if (key.length !== KEY_BYTES || key.toString("base64") !== encoded) {
      throw new Error();
    }

    const secret = Object.freeze({}) as CartSessionSecret;
    secretKeys.set(secret, key);
    return secret;
  } catch {
    throw sessionConfigurationError();
  }
}

/**
 * Creates a deterministic locator for resolving one server-held reference.
 * Possession is not authorization: re-resolve it against a current bounded
 * server snapshot before performing an action.
 */
export function createCartActionKey(
  input: CartActionKeyInput,
  secret: CartSessionSecret,
): CartActionKey {
  try {
    const storeDomain = validateStoreDomain(input.storeDomain);
    const reference = validateOpaqueReference(input.reference);
    const kind = validateActionKind(input.kind);
    const key = deriveSubkey(readSecretKey(secret), ACTION_KEY_INFO);
    const message = Buffer.from(
      JSON.stringify([ACTION_KEY_VERSION, storeDomain, kind, reference]),
      "utf8",
    );
    const digest = createHmac("sha256", key)
      .update(message)
      .digest("base64url");

    return `${ACTION_KEY_VERSION}_${digest}` as CartActionKey;
  } catch {
    throw new Error("Cart action key could not be created.");
  }
}

export function isCartActionKey(value: unknown): value is CartActionKey {
  return (
    typeof value === "string" &&
    ACTION_KEY_PATTERN.test(value) &&
    decodeCanonicalBase64Url(value.slice(3), KEY_BYTES) !== null
  );
}

/**
 * Compares an untrusted locator with the locator for one current server-held
 * reference. A match identifies a candidate only; it does not authorize use.
 */
export function matchesCartActionKey(
  value: unknown,
  input: CartActionKeyInput,
  secret: CartSessionSecret,
): boolean {
  try {
    if (!isCartActionKey(value)) {
      return false;
    }

    const expected = createCartActionKey(input, secret);
    const presentedDigest = decodeCanonicalBase64Url(
      value.slice(ACTION_KEY_VERSION.length + 1),
      KEY_BYTES,
    );
    const expectedDigest = decodeCanonicalBase64Url(
      expected.slice(ACTION_KEY_VERSION.length + 1),
      KEY_BYTES,
    );

    return (
      presentedDigest !== null &&
      expectedDigest !== null &&
      timingSafeEqual(presentedDigest, expectedDigest)
    );
  } catch {
    return false;
  }
}

/**
 * Seals the complete opaque Cart reference. Production callers must omit `iv`;
 * it exists only to make authenticated-encryption tests deterministic.
 */
export function sealCartSession(
  input: CartSessionInput,
  secret: CartSessionSecret,
  iv?: Uint8Array,
): string {
  try {
    const key = deriveSubkey(readSecretKey(secret), AEAD_KEY_INFO);
    const storeDomain = validateStoreDomain(input.storeDomain);
    const cartReference = validateOpaqueReference(input.cartReference);
    const initializationVector = validateIv(iv ?? randomBytes(IV_BYTES));
    const plaintext = Buffer.from(
      JSON.stringify({
        purpose: SESSION_PURPOSE,
        cartReference,
        ...(input.sellingPlansEnabled === true
          ? { sellingPlansEnabled: true }
          : {}),
      }),
      "utf8",
    );

    if (plaintext.length > MAX_SESSION_PLAINTEXT_BYTES) {
      throw new Error();
    }

    const cipher = createCipheriv(ALGORITHM, key, initializationVector, {
      authTagLength: AUTH_TAG_BYTES,
    });
    cipher.setAAD(additionalAuthenticatedData(storeDomain));

    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const sealed = [
      SESSION_VERSION,
      initializationVector.toString("base64url"),
      ciphertext.toString("base64url"),
      authTag.toString("base64url"),
    ].join(".");

    if (sealed.length > MAX_SESSION_ENVELOPE_LENGTH) {
      throw new Error();
    }

    return sealed;
  } catch {
    throw new Error("Cart session could not be sealed.");
  }
}

export function openCartSession(
  value: unknown,
  options: CartSessionOpenOptions,
): string | null {
  try {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > MAX_SESSION_ENVELOPE_LENGTH
    ) {
      return null;
    }

    const key = deriveSubkey(readSecretKey(options.secret), AEAD_KEY_INFO);
    const storeDomain = validateStoreDomain(options.storeDomain);
    const parts = value.split(".");

    if (parts.length !== 4 || parts[0] !== SESSION_VERSION) {
      return null;
    }

    const initializationVector = decodeCanonicalBase64Url(parts[1], IV_BYTES);
    const ciphertext = decodeCanonicalBase64Url(parts[2]);
    const authTag = decodeCanonicalBase64Url(parts[3], AUTH_TAG_BYTES);

    if (
      initializationVector === null ||
      ciphertext === null ||
      ciphertext.length === 0 ||
      ciphertext.length > MAX_SESSION_PLAINTEXT_BYTES ||
      authTag === null
    ) {
      return null;
    }

    const decipher = createDecipheriv(ALGORITHM, key, initializationVector, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAAD(additionalAuthenticatedData(storeDomain));
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    const payload: unknown = JSON.parse(decoded);

    if (!isCartSessionPayload(payload)) {
      return null;
    }

    // A Cart created while recurring purchases were enabled cannot be read as
    // one-time merchandise after that capability is removed. Legacy sessions
    // are one-time-only and likewise cannot cross into the enabled mode.
    if (
      (payload.sellingPlansEnabled === true) !==
      (options.sellingPlansEnabled === true)
    ) {
      return null;
    }

    return payload.cartReference;
  } catch {
    return null;
  }
}

export function cartSessionCookieOptions(
  isProduction: boolean,
): Readonly<CartSessionCookieOptions> {
  return Object.freeze({
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction === true,
  });
}

export function cartSessionCookieName(isProduction: boolean): string {
  return isProduction === true
    ? PRODUCTION_CART_SESSION_COOKIE_NAME
    : DEVELOPMENT_CART_SESSION_COOKIE_NAME;
}

function readSecretKey(secret: CartSessionSecret): Buffer {
  if (
    (typeof secret !== "object" && typeof secret !== "function") ||
    secret === null
  ) {
    throw sessionConfigurationError();
  }

  const key = secretKeys.get(secret);
  if (key === undefined) {
    throw sessionConfigurationError();
  }

  return key;
}

function validateStoreDomain(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    value.toLowerCase() !== value ||
    !STORE_DOMAIN_PATTERN.test(value)
  ) {
    throw sessionConfigurationError();
  }

  return value;
}

function validateOpaqueReference(value: string): string {
  const encoded = typeof value === "string" ? Buffer.from(value, "utf8") : null;

  if (
    encoded === null ||
    value.length === 0 ||
    encoded.length > MAX_OPAQUE_REFERENCE_UTF8_BYTES ||
    encoded.toString("utf8") !== value ||
    OPAQUE_REFERENCE_DISALLOWED_PATTERN.test(value)
  ) {
    throw new Error();
  }

  return value;
}

function validateActionKind(value: CartActionKind): CartActionKind {
  if (
    value !== "product_variant" &&
    value !== "product_subscription" &&
    value !== "cart_line"
  ) {
    throw new Error();
  }

  return value;
}

function validateIv(value: Uint8Array): Buffer {
  if (!(value instanceof Uint8Array) || value.byteLength !== IV_BYTES) {
    throw new Error();
  }

  return Buffer.from(value);
}

function additionalAuthenticatedData(storeDomain: string): Buffer {
  return Buffer.from(
    `${SESSION_PURPOSE}\0${SESSION_VERSION}\0${storeDomain}`,
    "utf8",
  );
}

function deriveSubkey(masterKey: Buffer, info: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", masterKey, HKDF_SALT, info, KEY_BYTES));
}

function decodeCanonicalBase64Url(
  value: string | undefined,
  requiredBytes?: number,
): Buffer | null {
  if (
    value === undefined ||
    value.length === 0 ||
    !BASE64URL_PATTERN.test(value)
  ) {
    return null;
  }

  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.toString("base64url") !== value ||
    (requiredBytes !== undefined && decoded.length !== requiredBytes)
  ) {
    return null;
  }

  return decoded;
}

function isCartSessionPayload(value: unknown): value is Readonly<{
  purpose: string;
  cartReference: string;
  sellingPlansEnabled?: true;
}> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const keys = Object.keys(payload);
  return (
    (keys.length === 2 ||
      (keys.length === 3 &&
        keys[2] === "sellingPlansEnabled" &&
        payload.sellingPlansEnabled === true)) &&
    keys[0] === "purpose" &&
    keys[1] === "cartReference" &&
    payload.purpose === SESSION_PURPOSE &&
    isValidOpaqueReference(payload.cartReference)
  );
}

function isValidOpaqueReference(value: unknown): value is string {
  try {
    validateOpaqueReference(value as string);
    return true;
  } catch {
    return false;
  }
}

function sessionConfigurationError(): Error {
  return new Error("Cart session configuration is invalid.");
}
