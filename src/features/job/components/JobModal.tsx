import React from "react";
import Modal from "../../../components/modal/Modal";

/**
 * Universal JobModal for create/edit job flows.
 *
 * Props:
 * - open: boolean (modal open state)
 * - onClose: () => void (close handler)
 * - title: React.ReactNode (modal title)
 * - size: string (modal size, e.g. "sm", "md", "lg", "xl")
 * - children: React.ReactNode (form component, e.g. <CreateJobForm /> or <EditJobForm />)
 * - trigger?: React.ReactElement (optional, for self-managed open)
 * - ...rest: any additional props passed to the form
 */
const JobModal = ({
  open,
  onClose,
  title,
  size = "sm",
  children,
  trigger,
  ...rest
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const modalOpen = isControlled ? open : internalOpen;

  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <>
      {trigger ? React.cloneElement(trigger, { onClick: handleOpen }) : null}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={title}
        size={size}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children, { ...rest, onCancel: handleClose })
          : children}
      </Modal>
    </>
  );
};

export default JobModal;

