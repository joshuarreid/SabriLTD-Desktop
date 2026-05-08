/*

This should implement the Modal.tsx component for the create modal.


*/

import React, { useState, useRef, useEffect } from "react";
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
  const [pendingClose, setPendingClose] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Start close timer only when saveState transitions to 'saved'
  useEffect(() => {
    if (saveState === "saved" && !pendingClose) {
      setPendingClose(true);
    }
  }, [saveState, pendingClose]);

  // Handle SaveStatus feedback and delayed close
  useEffect(() => {
    if (saveState === "saved" && pendingClose) {
      closeTimeout.current = setTimeout(() => {
        setPendingClose(false);
        onClose();
      }, 1000);
      return () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
      };
    }
  }, [saveState, pendingClose, onClose]);

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

  // Intercept Create button to delay close
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
          <div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <span>{title}</span>
            {/* SaveStatus in top right */}
            <div style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}>
              {(saveState === "saved" || saveState === "saving") && (
                <SaveStatus status={saveState} />
              )}
            </div>
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
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={onCancel} type="button">Cancel</button>
            <button className={styles.saveButton} onClick={handleCreate} type="button" disabled={isSaving}>Create</button>
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
