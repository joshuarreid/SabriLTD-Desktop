/*

This should implement the Modal.tsx component for the edit modal.


*/

import React, { useState } from "react";
import Modal from "./Modal";
import SaveStatus from "../../save/SaveStatus";
import ConfirmationModal from "../../confirmationmodal/ConfirmationModal";
import { FaRegTrashAlt } from "react-icons/fa";
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
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
  deleteConfirmText?: string;
  deleteCancelText?: string;
  // Add deleteStatus and related props
  deleteStatus?: 'idle' | 'deleting' | 'deleted' | 'error';
  deletingText?: string;
  deletedText?: string;
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
  deleteConfirmTitle = "Are you sure?",
  deleteConfirmDescription = "This action cannot be undone.",
  deleteConfirmText = "Delete",
  deleteCancelText = "Cancel",
  deleteStatus = "idle",
  deletingText = "Deleting...",
  deletedText = "Deleted",
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const handleDelete = () => {
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    setIsDeletePending(true); // Immediately disable confirm button
    onDelete();
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setIsDeletePending(false);
  };

  // Reset isDeletePending when deleteStatus changes
  React.useEffect(() => {
    if (isDeletePending && ["deleting", "deleted", "error"].includes(deleteStatus)) {
      setIsDeletePending(false);
    }
  }, [deleteStatus, isDeletePending]);

  // Close confirmation modal when deleteStatus transitions to deleted or error
  React.useEffect(() => {
    if (confirmOpen && (deleteStatus === "deleted" || deleteStatus === "error")) {
      setConfirmOpen(false);
    }
  }, [deleteStatus, confirmOpen]);

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
              {FaRegTrashAlt ? <FaRegTrashAlt /> : null}
            </button>
          </div>
        }
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={onCancel} type="button">Cancel</button>
            <button className={styles.saveButton} onClick={onSave} type="button" disabled={isSaving}>Save</button>
            <SaveStatus status={saveState} />
          </div>
        }
      >
        {children}
      </Modal>
      <ConfirmationModal
        open={confirmOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        confirmText={deleteConfirmText}
        cancelText={deleteCancelText}
        deleteStatus={deleteStatus}
        deletingText={deletingText}
        deletedText={deletedText}
        isConfirmLoading={isDeletePending || deleteStatus === "deleting"}
        confirmClass={undefined}
        cancelClass={undefined}
      />
    </>
  );
};

export default EditModal;
