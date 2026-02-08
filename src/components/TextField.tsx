type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  error?: string;
};

export default function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: TextFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 520, color: "inherit", fontSize: 15 }}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: error ? "1px solid rgba(200, 60, 60, 0.70)" : undefined,
          boxShadow: error ? "0 0 0 4px rgba(200, 60, 60, 0.10)" : undefined,
        }}
      />

      {error ? (
        <span style={{ color: "rgba(200, 60, 60, 0.95)", fontSize: 12 }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
