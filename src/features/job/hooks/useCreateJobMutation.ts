import { useState, useMemo } from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useCreateJob } from "./useJobs";

export type CreateJobPayload = {
  name: string;
  companyId: string | number;
  client: string;
  description: string;
  status: string;
  [key: string]: any;
};

export type CreateJobModalStatus = "idle" | "saving" | "saved" | "error";

export interface UseCreateJobMutation {
  status: CreateJobModalStatus;
  setStatus: (status: CreateJobModalStatus) => void;
  error: string | null;
  setError: (err: string | null) => void;
  pendingClose: boolean;
  setPendingClose: (pending: boolean) => void;
  createJobMutation: any;
  handleCreateJob: (payload: CreateJobPayload) => Promise<void>;
}

const useCreateJobMutation = (): UseCreateJobMutation => {
  const { user: currentUser } = useCurrentUser();
  const currentUserId = useMemo(() => currentUser?.userId ?? currentUser?.id ?? null, [currentUser]);

  const [status, setStatus] = useState<CreateJobModalStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState<boolean>(false);

  const createJobMutation = useCreateJob({
    onSuccess: (data: any) => {
      setStatus("saved");
      setPendingClose(true);
    },
    onError: (err: any) => {
      setStatus("error");
      setError(err?.message || "Failed to create job");
    },
  });

  const handleCreateJob = async (payload: CreateJobPayload) => {
    setError(null);
    setStatus("saving");
    setPendingClose(true);
    try {
      const normalized = {
        ...payload,
        companyId: Number(payload.companyId),
        name: String(payload.name || "").trim(),
        client: String(payload.client || "").trim(),
        description: String(payload.description || "").trim(),
        status: payload.status || "Active",
        updatedBy: currentUserId,
      };
      await createJobMutation.mutateAsync(normalized);
    } catch (err) {
      // onError will handle error state
    }
  };

  return {
    status,
    setStatus,
    error,
    setError,
    pendingClose,
    setPendingClose,
    createJobMutation,
    handleCreateJob,
  };
};

export default useCreateJobMutation;

