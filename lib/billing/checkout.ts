export type CheckoutFormData = {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  billingZip: string;
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string) {
  const digits = digitsOnly(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvc(value: string) {
  return digitsOnly(value).slice(0, 4);
}

export function formatZip(value: string) {
  return digitsOnly(value).slice(0, 10);
}

export function validateCheckoutForm(
  data: CheckoutFormData,
): Partial<Record<keyof CheckoutFormData, string>> {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

  if (!data.cardholderName.trim()) {
    errors.cardholderName = "Enter the name on the card.";
  }

  const cardDigits = digitsOnly(data.cardNumber);
  if (cardDigits.length < 15 || cardDigits.length > 16) {
    errors.cardNumber = "Enter a valid card number.";
  }

  const expiryDigits = digitsOnly(data.expiry);
  if (expiryDigits.length !== 4) {
    errors.expiry = "Use MM/YY format.";
  } else {
    const month = Number.parseInt(expiryDigits.slice(0, 2), 10);
    const year = Number.parseInt(expiryDigits.slice(2), 10) + 2000;
    const now = new Date();
    const expiryEnd = new Date(year, month, 0);
    if (month < 1 || month > 12 || expiryEnd < now) {
      errors.expiry = "Card has expired or date is invalid.";
    }
  }

  const cvc = digitsOnly(data.cvc);
  if (cvc.length < 3) {
    errors.cvc = "Enter the security code.";
  }

  if (data.billingZip.trim() && digitsOnly(data.billingZip).length < 5) {
    errors.billingZip = "Enter a valid billing ZIP code.";
  }

  return errors;
}

export function maskCardNumber(cardNumber: string) {
  const digits = digitsOnly(cardNumber);
  const last4 = digits.slice(-4).padStart(4, "•");
  return `•••• •••• •••• ${last4}`;
}
