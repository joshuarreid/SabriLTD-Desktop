/**
 * @deprecated
 * CreateJobModal no longer uses a dedicated orchestration hook.
 * Per docs/modal.md, the feature modal wrapper owns the mutation + save lifecycle via useSaveStatus.
 *
 * This file is kept temporarily to avoid import breakages; prefer using `useModal` for open/close only.
 */

import useModal from "../../../components/modal/hooks/useModal";

export const useCreateJobModal = () => {
    return useModal(false);
};

export default useCreateJobModal;
