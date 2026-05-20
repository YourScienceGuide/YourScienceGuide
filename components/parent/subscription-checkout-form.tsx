"use client";

import { useState } from "react";
import { CreditCard, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatCardNumber,
  formatCvc,
  formatExpiry,
  digitsOnly,
  formatZip,
  validateCheckoutForm,
  type CheckoutFormData,
} from "@/lib/billing/checkout";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";

const EMPTY_FORM: CheckoutFormData = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  billingZip: "",
};

type SubscriptionCheckoutFormProps = {
  plan: SubscriptionPlan;
  onBack: () => void;
  onSuccess: (payment: { cardLast4: string }) => void;
};

export function SubscriptionCheckoutForm({
  plan,
  onBack,
  onSuccess,
}: SubscriptionCheckoutFormProps) {
  const planInfo = SUBSCRIPTION_PLANS[plan];
  const [form, setForm] = useState<CheckoutFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof CheckoutFormData>(
    key: K,
    value: CheckoutFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateCheckoutForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1400));
    setSubmitting(false);
    onSuccess({ cardLast4: digitsOnly(form.cardNumber).slice(-4) });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 dark:border-stone-700 dark:bg-stone-800/40">
        <p className="text-xs font-medium uppercase tracking-wide text-sky-700 dark:text-stone-400">
          Order summary
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-slate-900 dark:text-stone-50">
            {planInfo.label} plan
          </p>
          <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-stone-50">
            {planInfo.price}
            <span className="text-sm font-normal text-slate-500 dark:text-stone-500">
              {" "}
              {planInfo.interval}
            </span>
          </p>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
          {planInfo.description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-stone-50">
            <CreditCard className="size-4 shrink-0" aria-hidden />
            Payment details
          </div>

          <Field
            id="cardholder-name"
            label="Name on card"
            error={errors.cardholderName}
          >
            <Input
              id="cardholder-name"
              name="cardholderName"
              autoComplete="cc-name"
              value={form.cardholderName}
              onChange={(e) => updateField("cardholderName", e.target.value)}
              placeholder="Alex Rivera"
              disabled={submitting}
              aria-invalid={Boolean(errors.cardholderName)}
              aria-describedby={
                errors.cardholderName ? "cardholder-name-error" : undefined
              }
            />
          </Field>

          <Field
            id="card-number"
            label="Card number"
            error={errors.cardNumber}
          >
            <Input
              id="card-number"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              value={form.cardNumber}
              onChange={(e) =>
                updateField("cardNumber", formatCardNumber(e.target.value))
              }
              placeholder="4242 4242 4242 4242"
              disabled={submitting}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="card-expiry" label="Expiration" error={errors.expiry}>
              <Input
                id="card-expiry"
                name="expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={form.expiry}
                onChange={(e) =>
                  updateField("expiry", formatExpiry(e.target.value))
                }
                placeholder="MM/YY"
                disabled={submitting}
              />
            </Field>
            <Field id="card-cvc" label="Security code" error={errors.cvc}>
              <Input
                id="card-cvc"
                name="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={form.cvc}
                onChange={(e) => updateField("cvc", formatCvc(e.target.value))}
                placeholder="123"
                disabled={submitting}
              />
            </Field>
          </div>

          <Field
            id="billing-zip"
            label="Billing ZIP code"
            hint="Optional for this mock checkout"
            error={errors.billingZip}
          >
            <Input
              id="billing-zip"
              name="billingZip"
              inputMode="numeric"
              autoComplete="postal-code"
              value={form.billingZip}
              onChange={(e) =>
                updateField("billingZip", formatZip(e.target.value))
              }
              placeholder="12345"
              disabled={submitting}
            />
          </Field>
        </div>

        <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-stone-500">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Mock checkout only — no card data is sent to a server. Use any test
          values; 4242… is a common demo number.
        </p>

        <div className="flex flex-wrap gap-3 border-t border-sky-100 pt-6 dark:border-stone-800">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Processing payment…" : `Pay ${planInfo.price}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={onBack}
          >
            Back to plans
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-stone-300"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500 dark:text-stone-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
