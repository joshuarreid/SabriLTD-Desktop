import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "../styles/modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hideCloseButton?: boolean;
}

const SIZE_WIDTH_MAP: Record<string, number> = {
  sm: 360,
  md: 500,
  lg: 700,
  xl: 900,
    xxl: 1200
};

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width,
  size = "md",
  className = "",
  hideCloseButton = false,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  // Determine modal width: width prop takes precedence, otherwise use size
  const modalWidth = width !== undefined ? width : SIZE_WIDTH_MAP[size] || SIZE_WIDTH_MAP.md;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalCard} ${className}`}
        style={{ width: modalWidth }}
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {title && <div className={styles.modalHeader}>{title}</div>}
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
        {!hideCloseButton && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">×</button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
