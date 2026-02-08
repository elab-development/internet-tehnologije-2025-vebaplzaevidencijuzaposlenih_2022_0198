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
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 18, 24, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          borderRadius: 16,
          border: "1px solid rgba(215, 219, 226, 0.95)",
          background: "rgba(246, 247, 249, 0.92)",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{ fontWeight: 650, fontSize: 15, letterSpacing: "-0.01em" }}
          >
            {title ?? "Modal"}
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(215, 219, 226, 0.95)",
              background: "rgba(236, 239, 243, 0.95)",
              color: "inherit",
              borderRadius: 12,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 560,
            }}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
