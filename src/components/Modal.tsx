type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      style={{
        background: "rgba(15, 18, 24, 0.5)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="modalContent"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "24px 28px",
          boxShadow: "0 24px 64px rgba(15, 23, 42, 0.22)",
          borderRadius: 16,
          border: "1px solid #d7dbe2",
        }}
      >
        <div
          className="modalHeader"
          style={{
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: "1px solid #e5e7eb",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <div>{title ?? "Modal"}</div>
          <button type="button" className="modalCloseBtn" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
