import React from "react";
import JobModal from "./JobModal";
import EditJobForm from "./EditJobForm";

interface EditJobModalProps {
  open: boolean;
  onClose: () => void;
  job: any;
  edit: any;
  isActive: boolean;
  companyName: string;
  companyLoading: boolean;
  companyError: string | null;
  userName: string;
  userLoading: boolean;
  userError: string | null;
  formatDisplayDate: (value: string) => string;
  [key: string]: any;
}

const logger = {
  info: (...args: any[]) => console.log("[EditJobModal]", ...args),
  error: (...args: any[]) => console.error("[EditJobModal]", ...args),
};

const EditJobModal: React.FC<EditJobModalProps> = (props) => {
  logger.info("Rendering EditJobModal with props", props);
  const { open, onClose, trigger = null, ...rest } = props;
  return (
    <JobModal
      open={open}
      onClose={() => {
        logger.info("Modal closed");
        onClose();
      }}
      title={<h2>Edit Job</h2>}
      size="sm"
      trigger={trigger}
    >
      <EditJobForm {...rest} />
    </JobModal>
  );
};

export default EditJobModal;
