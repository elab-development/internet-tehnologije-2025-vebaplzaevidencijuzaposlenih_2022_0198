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
      <label style={{ fontWeight: 700, color:"inherit" }}>{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: error ? "1px solid #b00020" : "1px solid #ccc",
          outline: "none",
        }}
      />

      {error ? (
        <span style={{ color: "#b00020", fontSize: 12 }}>{error}</span>
      ) : null}
    </div>
  );
}
