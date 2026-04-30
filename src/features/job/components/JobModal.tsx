import React from "react";
import Modal from "../../../components/modal/components/Modal";

export interface JobModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  trigger?: React.ReactElement;
  [key: string]: any;
}

/**
 * Universal JobModal for create/edit job flows.
 */
const JobModal: React.FC<JobModalProps> = ({
  open,
  onClose,
  title,
  size = "sm",
  children,
  trigger,
  ...rest
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const modalOpen = open;

  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <>
      {trigger ? React.cloneElement(trigger as React.ReactElement<any>, { onClick: handleOpen }) : null}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={title}
        size={size}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, { ...rest, onCancel: handleClose })
          : children}
      </Modal>
    </>
  );
};

export default JobModal;
