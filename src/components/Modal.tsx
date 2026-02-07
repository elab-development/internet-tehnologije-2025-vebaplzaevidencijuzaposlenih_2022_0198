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
        background: "rgba(0, 0, 0, 0.6)",
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
          borderRadius: 14,
          border: "1px solid #333",
          background: "rgba(255, 255, 255, 0.96)",
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
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {title ?? "Modal"}
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #333",
              background: "rgba(255, 255, 255, 0.96)",
              color: "inherit",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            X
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
