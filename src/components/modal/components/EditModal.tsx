/*

This should implement the Modal.tsx component for the edit modal.


*/

import React, { useState } from "react";
import Modal from "./Modal";
import SaveStatus from "../../save/SaveStatus";
import ConfirmationModal from "../../confirmationmodal/ConfirmationModal";
import { DeletedCheck } from "../../delete/DeleteStatus";
import styles from "../../../features/job/styles/createjobmodal.module.css";

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  isSaving: boolean;
  saveState: any;
  title?: React.ReactNode;
  children: React.ReactNode;
  deleteTooltip?: string;
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  onClose,
  onSave,
  onCancel,
  onDelete,
  isSaving,
  saveState,
  title,
  children,
  deleteTooltip = "Delete",
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDelete();
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{title}</span>
            <button
              className={styles.trashButton}
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={handleDelete}
              title={deleteTooltip}
              type="button"
            >
              <DeletedCheck />
            </button>
          </div>
        }
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={onCancel} type="button">Cancel</button>
            <button className={styles.saveButton} onClick={onSave} type="button" disabled={isSaving}>Save</button>
            <SaveStatus state={saveState} />
          </div>
        }
      >
        {children}
      </Modal>
      <ConfirmationModal
        open={confirmOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete?"
      />
    </>
  );
};

export default EditModal;
