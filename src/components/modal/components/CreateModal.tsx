/*

This should implement the Modal.tsx component for the create modal.


*/

import React, { useState } from "react";
import Modal from "./Modal";
import SaveStatus from "../../save/SaveStatus";
import ConfirmationModal from "../../confirmationmodal/ConfirmationModal";
import { DeletedCheck } from "../../delete/DeleteStatus";
import styles from "../../../features/job/styles/createjobmodal.module.css";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  saveState: any;
  showDelete?: boolean;
  title?: React.ReactNode;
  children: React.ReactNode;
  deleteTooltip?: string;
}

const CreateModal: React.FC<CreateModalProps> = ({
  open,
  onClose,
  onCreate,
  onCancel,
  onDelete,
  isSaving,
  saveState,
  showDelete = false,
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
    onDelete && onDelete();
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreate();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{title}</span>
            {showDelete && (
              <button
                className={styles.trashButton}
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={handleDelete}
                title={deleteTooltip}
                type="button"
              >
                <DeletedCheck />
              </button>
            )}
          </div>
        }
        footer={
          <div className={styles.modalFooter} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button className={styles.cancelButton} onClick={onCancel} type="button" disabled={isSaving}>
                Cancel
              </button>
              <button className={styles.saveButton} onClick={handleCreate} type="button" disabled={isSaving}>
                Create
              </button>
            </div>

            {/* Bottom-right save feedback (what users expect to see) */}
            <div style={{ minWidth: 140, display: "flex", justifyContent: "flex-end" }}>
              <SaveStatus status={saveState} />
            </div>
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

export default CreateModal;
