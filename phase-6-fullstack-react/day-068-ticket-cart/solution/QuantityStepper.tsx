import { useState } from "react";

interface QuantityStepperProps {
  label: string; // "VIP": used in every accessible name, so "Add one VIP" isn't just "+"
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (quantity: number) => void;
}

// − [ 2 ] +, where the number can be typed too. The cart owns the number; this only shows it and
// reports what the fan did. While they're typing, what's in the box is a draft, kept in local state
// and only sent on Enter or when they leave the box.
export function QuantityStepper({ label, value, onIncrement, onDecrement, onSet }: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    onSet(draft.trim() === "" ? 0 : Number(draft));
    setDraft(null);
  };

  return (
    <div className="stepper" role="group" aria-label={`${label} tickets`}>
      <button type="button" onClick={onDecrement} disabled={value === 0} aria-label={`Remove one ${label}`}>
        −
      </button>
      <input
        inputMode="numeric"
        aria-label={`Number of ${label} tickets`}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
      />
      <button type="button" onClick={onIncrement} aria-label={`Add one ${label}`}>
        +
      </button>
    </div>
  );
}
