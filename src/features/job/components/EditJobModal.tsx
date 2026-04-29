import React from "react";
import JobModal from "./JobModal";
import EditJobForm from "./EditJobForm";

const EditJobModal = (props) => {
  return (
    <JobModal
      open={props.open}
      onClose={props.onClose}
      title={<h2>Edit Job</h2>}
      size="sm"
      {...props}
    >
      <EditJobForm />
    </JobModal>
  );
};

export default EditJobModal;
