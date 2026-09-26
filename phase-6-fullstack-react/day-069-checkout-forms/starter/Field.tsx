import { useId, type ReactNode } from "react";

// What a field's input needs, so that the label, hint and error are all tied to it.
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (control: FieldControlProps) => ReactNode;
}

// TODO: a label, the input, a hint and an error, wired together.
// <div className="field" data-invalid={error ? "" : undefined}>
//   <label htmlFor={id}>label</label>
//   <p className="field-hint" id={id + "-hint"}>hint</p>          (only with a hint)
//   {children({ id, "aria-invalid": ..., "aria-describedby": the hint and error ids, space-separated, or undefined })}
//   <p className="field-error" id={id + "-error"}>error</p>       (only with an error)
// </div>
// The input comes from the caller (a "render prop"), so one Field works for any kind of input.
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  void [hint, error];
  return (
    <div>
      <label>{label}</label>
      {children({ id, "aria-invalid": false, "aria-describedby": undefined })}
    </div>
  );
}
