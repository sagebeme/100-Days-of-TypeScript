import { useState } from "react";

interface QuantityStepperProps {
  label: string; // "VIP": used in every accessible name, so "Add one VIP" isn't just "+"
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (quantity: number) => void;
}

// TODO: − [ 2 ] +, where the number can be typed too.
// <div className="stepper" role="group" aria-label="VIP tickets">
//   <button type="button" aria-label="Remove one VIP" disabled at 0>−</button>
//   <input inputMode="numeric" aria-label="Number of VIP tickets" />
//   <button type="button" aria-label="Add one VIP">+</button>
// </div>
// The cart owns the number: this only shows `value` and reports clicks. While the fan is typing,
// keep what's in the box as a draft with useState (string | null: null means "show value"), keep
// digits only, and call onSet once: on Enter, or when the box loses focus (onBlur). Empty means 0.
// Escape throws the draft away.
export function QuantityStepper({ label, value, onIncrement, onDecrement, onSet }: QuantityStepperProps) {
  void [useState, onIncrement, onDecrement, onSet];
  return (
    <p>
      TODO: {value} {label}
    </p>
  );
}
