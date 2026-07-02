/** Plain client-side validation — no schema libraries */

export function validateLoginForm({ username, password }) {
  const errors = {};
  if (!username?.trim()) errors.username = 'Username is required.';
  if (!password)         errors.password = 'Password is required.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateRegisterForm({ username, password, password_confirm, email }) {
  const errors = {};
  if (!username?.trim())          errors.username = 'Username is required.';
  if (!password)                  errors.password = 'Password is required.';
  if (password !== password_confirm) errors.password_confirm = 'Passwords do not match.';
  if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateProductForm({ ProductName, ProductCode, variants = [] }) {
  const errors = {};

  if (!ProductName?.trim()) errors.ProductName = 'Product Name is required.';
  if (!ProductCode?.trim()) errors.ProductCode = 'Product Code is required.';

  if (variants.length > 0) {
    // Unique names (case-insensitive)
    const names = variants.map((v) => v.name?.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      errors.variants = 'Variant names must be unique.';
    } else {
      for (let i = 0; i < variants.length; i++) {
        if (!variants[i].name?.trim()) {
          errors.variants = `Variant ${i + 1}: name is required.`;
          break;
        }
        if (!variants[i].options?.length) {
          errors.variants = `Variant "${variants[i].name}": must have at least 1 option.`;
          break;
        }
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStockForm({ sub_variant_id, quantity }, availableStock = null) {
  const errors = {};
  if (!sub_variant_id)           errors.sub_variant_id = 'Please select a sub-variant.';
  if (!quantity || quantity <= 0) errors.quantity = 'Quantity must be greater than 0.';
  if (availableStock !== null && quantity > availableStock) {
    errors.quantity = `Cannot exceed available stock (${availableStock}).`;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
