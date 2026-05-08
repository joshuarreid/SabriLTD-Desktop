import { useCallback, useState } from "react";

export interface UseModal {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  setOpen: (open: boolean) => void;
}

const useModal = (initialOpen = false): UseModal => {
  const [open, setOpen] = useState(initialOpen);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return { open, openModal, closeModal, setOpen };
};

export default useModal;

