import type {
  AddCartLineCommand,
  RemoveCartLineCommand,
  UpdateCartLineCommand,
} from "./cart-application";

const MAX_GRAPHQL_INT = 2_147_483_647;
const MAX_PRODUCT_HANDLE_LENGTH = 255;
const PRODUCT_HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTION_KEY_PATTERN = /^v1_[A-Za-z0-9_-]{43}$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]{0,9}$/;
const FRAMEWORK_ACTION_PREFIX = "$ACTION_";
const MAX_FRAMEWORK_FIELDS = 8;
const MAX_FRAMEWORK_VALUE_LENGTH = 2_048;

export function parseAddCartLineForm(
  formData: unknown,
): Readonly<AddCartLineCommand> | null {
  const fields = readExactStringFields(formData, [
    "productHandle",
    "variantKey",
    "quantity",
  ]);

  if (fields === null) {
    return null;
  }

  const productHandle = fields.productHandle;
  const variantKey = fields.variantKey;
  const quantity = parsePositiveGraphqlInt(fields.quantity);

  if (
    productHandle === undefined ||
    variantKey === undefined ||
    quantity === null ||
    productHandle.length === 0 ||
    productHandle.length > MAX_PRODUCT_HANDLE_LENGTH ||
    !PRODUCT_HANDLE_PATTERN.test(productHandle) ||
    !ACTION_KEY_PATTERN.test(variantKey)
  ) {
    return null;
  }

  return Object.freeze({ productHandle, variantKey, quantity });
}

export function parseUpdateCartLineForm(
  formData: unknown,
): Readonly<UpdateCartLineCommand> | null {
  const fields = readExactStringFields(formData, ["lineKey", "quantity"]);

  if (fields === null) {
    return null;
  }

  const lineKey = fields.lineKey;
  const quantity = parsePositiveGraphqlInt(fields.quantity);

  if (
    lineKey === undefined ||
    quantity === null ||
    !ACTION_KEY_PATTERN.test(lineKey)
  ) {
    return null;
  }

  return Object.freeze({ lineKey, quantity });
}

export function parseRemoveCartLineForm(
  formData: unknown,
): Readonly<RemoveCartLineCommand> | null {
  const fields = readExactStringFields(formData, ["lineKey"]);

  if (fields === null) {
    return null;
  }

  const lineKey = fields.lineKey;

  if (lineKey === undefined || !ACTION_KEY_PATTERN.test(lineKey)) {
    return null;
  }

  return Object.freeze({ lineKey });
}

export function isEmptyCheckoutForm(formData: unknown): boolean {
  if (!isFormData(formData)) {
    return false;
  }

  try {
    let frameworkFieldCount = 0;

    for (const [name, value] of formData.entries()) {
      if (!isBoundedFrameworkField(name, value)) {
        return false;
      }

      frameworkFieldCount += 1;
      if (frameworkFieldCount > MAX_FRAMEWORK_FIELDS) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return true;
}

function readExactStringFields<const Names extends readonly string[]>(
  formData: unknown,
  expectedNames: Names,
): Readonly<Partial<Record<Names[number], string>>> | null {
  if (!isFormData(formData)) {
    return null;
  }

  const expected = new Set<string>(expectedNames);
  const result: Partial<Record<Names[number], string>> = {};
  let fieldCount = 0;
  let frameworkFieldCount = 0;

  try {
    for (const [name, value] of formData.entries()) {
      // React/Next adds transport metadata to a Server Action FormData payload.
      // It is bounded and ignored; it never becomes an application argument.
      if (name.startsWith(FRAMEWORK_ACTION_PREFIX)) {
        frameworkFieldCount += 1;
        if (
          frameworkFieldCount > MAX_FRAMEWORK_FIELDS ||
          !isBoundedFrameworkField(name, value)
        ) {
          return null;
        }
        continue;
      }

      fieldCount += 1;

      if (
        fieldCount > expectedNames.length ||
        !expected.has(name) ||
        typeof value !== "string" ||
        Object.prototype.hasOwnProperty.call(result, name)
      ) {
        return null;
      }

      result[name as Names[number]] = value;
    }
  } catch {
    return null;
  }

  if (fieldCount !== expectedNames.length) {
    return null;
  }

  return Object.freeze(result);
}

function isBoundedFrameworkField(name: string, value: unknown): boolean {
  return (
    name.startsWith(FRAMEWORK_ACTION_PREFIX) &&
    name.length <= 128 &&
    typeof value === "string" &&
    value.length <= MAX_FRAMEWORK_VALUE_LENGTH
  );
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function parsePositiveGraphqlInt(value: string | undefined): number | null {
  if (value === undefined || !POSITIVE_INTEGER_PATTERN.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return parsed <= MAX_GRAPHQL_INT ? parsed : null;
}

export type CartRequest =
  | { action: "add"; command: AddCartLineCommand }
  | { action: "update"; command: UpdateCartLineCommand }
  | { action: "remove"; command: RemoveCartLineCommand };

/** Exact JSON boundary: no vendor identifiers, prices or extra fields accepted. */
export function parseCartRequest(value: unknown): CartRequest | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const input = value as Record<string, unknown>;
  const action = input.action;
  const names =
    action === "add"
      ? ["action", "productHandle", "variantKey", "quantity"]
      : action === "update"
        ? ["action", "lineKey", "quantity"]
        : action === "remove"
          ? ["action", "lineKey"]
          : [];
  if (
    names.length === 0 ||
    Object.keys(input).length !== names.length ||
    names.some((name) => !Object.hasOwn(input, name)) ||
    (action !== "remove" &&
      (typeof input.quantity !== "number" ||
        !Number.isSafeInteger(input.quantity)))
  ) {
    return null;
  }
  const form = new FormData();
  for (const name of names) {
    if (name === "action") continue;
    if (name !== "quantity" && typeof input[name] !== "string") return null;
    form.set(name, String(input[name]));
  }
  if (action === "add") {
    const command = parseAddCartLineForm(form);
    return command ? { action, command } : null;
  }
  if (action === "update") {
    const command = parseUpdateCartLineForm(form);
    return command ? { action, command } : null;
  }
  const command = parseRemoveCartLineForm(form);
  return command ? { action: "remove", command } : null;
}
