import React from "react";
import Modal from "../../../components/modal/components/Modal";

export interface BuildingModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  className?: string;
}

/**
 * Universal BuildingModal for create/edit building flows.
 */
const BuildingModal: React.FC<BuildingModalProps> = ({
  open,
  onClose,
  title,
  size = "sm",
  children,
  footer,
  width,
  className = "",
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={footer}
      width={width}
      className={className}
    >
      {children}
    </Modal>
  );
};

export default BuildingModal;

