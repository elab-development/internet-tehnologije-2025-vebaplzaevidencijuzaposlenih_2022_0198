type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  error?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export default function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  onKeyDown,
}: TextFieldProps) {
  return (
    <div className="textFieldWrap" style={{ gap: 8 }}>
      <label style={{ fontWeight: 600, fontSize: 14 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          padding: "12px 14px",
          minHeight: 44,
          borderRadius: 10,
          border: error ? "1px solid rgba(200, 60, 60, 0.7)" : "1px solid #d7dbe2",
          boxShadow: error ? "0 0 0 3px rgba(200, 60, 60, 0.12)" : "0 1px 2px rgba(15, 23, 42, 0.04)",
          fontSize: 15,
          ...(error ? {} : { transition: "border-color 0.2s ease, box-shadow 0.2s ease" }),
        }}
      />
      {error ? <span className="errorText" style={{ fontSize: 13 }}>{error}</span> : null}
    </div>
  );
}
