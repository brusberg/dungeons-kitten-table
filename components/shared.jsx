import { clamp } from "../lib/helpers";

export function Stepper({ value, min = 0, max = 10, onChange, label }) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1, min, max))} aria-label={`Lower ${label}`}>
        -
      </button>
      <input
        value={value}
        onChange={(event) => onChange(clamp(event.target.value, min, max))}
        aria-label={label}
        inputMode="numeric"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1, min, max))} aria-label={`Raise ${label}`}>
        +
      </button>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function TextBlock({ label, value, onChange, rows = 4 }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
    </label>
  );
}

export function IconButton({ children, label, className = "", ...props }) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function PillButton({ active, children, className = "", ...props }) {
  return (
    <button className={`pill-button ${active ? "is-active" : ""} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
