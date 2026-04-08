import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCompanies, createCompany } from "../../../api/company/company";
import { getJobClients, updateJob } from "../../../api/job/job";
import { companyKeys } from "../../../api/company/companyQueryKeys";
import { jobKeys } from "../../../api/job/jobQueryKeys";
import { userKeys } from "../../../api/user/userQueryKeys";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

/**
 * Logger for useEditJobDetails.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useEditJobDetails]", ...args),
    error: (...args) => console.error("[useEditJobDetails]", ...args),
};

/**
 * normalizeIdToString
 * - Normalizes IDs to string for safe comparisons in dropdowns.
 *
 * @function normalizeIdToString
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
const normalizeIdToString = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
};

/**
 * buildCompanyOptions
 * - Builds options for FilterDropdownSearch from companies.
 *
 * @function buildCompanyOptions
 * @param {Array<any>} companies
 * @returns {Array<{value: string, label: string}>}
 */
const buildCompanyOptions = (companies) => {
    if (!Array.isArray(companies)) return [];
    return companies.map((c) => ({
        value: normalizeIdToString(c.id ?? c.companyId),
        label: c.name || `Company ${c.id ?? c.companyId}`,
    }));
};

/**
 * buildClientOptions
 * - Builds unique, sorted client options for FilterDropdownSearch from API response.
 *
 * @function buildClientOptions
 * @param {Array<any>} clients
 * @returns {Array<{value: string, label: string}>}
 */
const buildClientOptions = (clients) => {
    if (!Array.isArray(clients)) return [];

    const uniqueClients = [
        ...new Set(
            clients
                .map((c) => (typeof c === "string" ? c : c?.clientName))
                .filter(Boolean),
        ),
    ];

    return uniqueClients
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((name) => ({ value: String(name), label: String(name) }));
};

/**
 * getInitialEditValuesFromJob
 * - Normalizes job data into the editValues shape used by the UI.
 *
 * @function getInitialEditValuesFromJob
 * @param {any} job
 * @returns {{name: string, client: string, description: string, companyId: string}}
 */
const getInitialEditValuesFromJob = (job) => {
    return {
        name: job?.name || "",
        client: job?.client || "",
        description: job?.description || "",
        companyId: normalizeIdToString(job?.companyId),
    };
};

/**
 * safeStringTrim
 * - Utility to normalize possibly-null values into trimmed strings.
 *
 * @function safeStringTrim
 * @param {any} value
 * @returns {string}
 */
const safeStringTrim = (value) => {
    return String(value || "").trim();
};

/**
 * resolveCurrentUserId
 * - Resolves a numeric user id from the `useCurrentUser` payload.
 *
 * NOTE:
 * - `useCurrentUser` returns the result of `getMe()`. This app historically uses `userId`.
 *
 * @function resolveCurrentUserId
 * @param {any} user
 * @returns {number|null}
 */
const resolveCurrentUserId = (user) => {
    const candidate = user?.userId ?? user?.id ?? null;
    const asNum = candidate === null || candidate === undefined ? NaN : Number(candidate);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

/**
 * useEditJobDetails
 * - Manages edit mode state for job details and related dropdown data (companies + clients).
 * - Owns editValues, edit-mode toggling, and "create new company/client" behaviors.
 * - Handles saving job updates and ensures `updatedBy` is populated from `useCurrentUser`.
 *
 * IMPORTANT:
 * - There is no dedicated "create client" API. Clients are derived from jobs for a company.
 * - Therefore "create new client" is implemented as:
 *   1) update local draft field `editValues.client`
 *   2) ensure the dropdown options include the draft value immediately
 *   3) on Save, persist client name on the job, and invalidate the "clients" list query
 *
 * @function useEditJobDetails
 * @param {object} params
 * @param {any} params.job - Loaded job object (source of truth).
 * @returns {object} Edit model used by JobDetailScreen.
 */
const useEditJobDetails = ({ job }) => {
    logger.info("useEditJobDetails initialized", { jobId: job?.jobId });

    const queryClient = useQueryClient();

    /**
     * currentUserState
     * - Current authenticated user info used to populate `updatedBy`.
     */
    const { user: currentUser, loading: currentUserLoading, error: currentUserError } =
        useCurrentUser();

    /**
     * isEditMode
     * - Indicates whether the screen is in edit mode.
     *
     * @type {boolean}
     */
    const [isEditMode, setIsEditMode] = useState(false);

    /**
     * editValues
     * - Draft values while editing job fields.
     *
     * @type {{name: string, client: string, description: string, companyId: string}}
     */
    const [editValues, setEditValues] = useState(() => getInitialEditValuesFromJob(job));

    /**
     * Effect: keep editValues in sync when:
     * - job changes while in edit mode (rare, but possible)
     * - user enters edit mode after job is loaded
     */
    useEffect(() => {
        if (!job) return;
        if (!isEditMode) return;

        logger.info("Syncing editValues from job while in edit mode", {
            jobId: job?.jobId,
            companyId: job?.companyId,
        });

        setEditValues(getInitialEditValuesFromJob(job));
    }, [job, isEditMode]);

    /**
     * toggleEditMode
     * - Enters/leaves edit mode.
     * - Always resets draft to the latest job values (acts as cancel + reset).
     *
     * @function toggleEditMode
     * @returns {void}
     */
    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev) => {
            const next = !prev;

            logger.info("toggleEditMode called", {
                jobId: job?.jobId,
                from: prev,
                to: next,
            });

            setEditValues(getInitialEditValuesFromJob(job));
            return next;
        });
    }, [job]);

    /**
     * updateEditField
     * - Updates a single editValues field.
     *
     * @function updateEditField
     * @param {"name"|"client"|"description"|"companyId"} field
     * @param {any} nextValue
     * @returns {void}
     */
    const updateEditField = useCallback((field, nextValue) => {
        setEditValues((prev) => ({
            ...prev,
            [field]: nextValue,
        }));
    }, []);

    /**
     * companies query
     * - Fetch all companies for dropdown when editing.
     */
    const {
        data: companies = [],
        isPending: isCompaniesPending,
        isError: isCompaniesError,
    } = useQuery({
        queryKey: [...companyKeys.all, "all"],
        queryFn: () => getAllCompanies(),
        enabled: isEditMode,
        staleTime: 5 * 60 * 1000,
    });

    /**
     * createCompanyMutation
     * - Creates a new company and refreshes the companies list.
     */
    const createCompanyMutation = useMutation({
        mutationFn: (companyDataToCreate) => createCompany(companyDataToCreate),
        onSuccess: (newCompany) => {
            logger.info("New company created successfully", { newCompanyId: newCompany?.id });

            queryClient.invalidateQueries({ queryKey: companyKeys.all });

            const nextCompanyId = normalizeIdToString(newCompany?.id ?? newCompany?.companyId);
            if (nextCompanyId) {
                setEditValues((prev) => ({
                    ...prev,
                    companyId: nextCompanyId,
                    client: "",
                }));
            }
        },
        onError: (err) => {
            logger.error("Failed to create company", err);
        },
    });

    /**
     * selectedCompanyId
     * - Current selected companyId as a string.
     *
     * @type {string}
     */
    const selectedCompanyId = editValues.companyId;

    /**
     * clients query
     * - Fetch clients for selected company while editing.
     */
    const {
        data: clients = [],
        isPending: isClientsPending,
        isError: isClientsError,
        refetch: refetchClients,
    } = useQuery({
        queryKey: [...jobKeys.all, "clients", selectedCompanyId],
        queryFn: () => getJobClients({ companyId: selectedCompanyId }),
        enabled: isEditMode && Boolean(selectedCompanyId),
        staleTime: 5 * 60 * 1000,
    });

    /**
     * companyOptions
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => buildCompanyOptions(companies), [companies]);

    /**
     * clientOptions
     * - Includes the current editValues.client if not already in API results.
     * - This guarantees that a newly "created" client name stays selectable/visible
     *   even before Save persists it (clients are derived from jobs).
     *
     * @type {Array<{value:string,label:string}>}
     */
    const clientOptions = useMemo(() => {
        if (!selectedCompanyId) return [];

        const apiOptions = buildClientOptions(clients);

        const currentClient = safeStringTrim(editValues.client);
        if (!currentClient) return apiOptions;

        const alreadyExists = apiOptions.some(
            (opt) => String(opt.value).toLowerCase() === currentClient.toLowerCase(),
        );

        if (alreadyExists) return apiOptions;

        return [{ value: currentClient, label: currentClient }, ...apiOptions];
    }, [clients, selectedCompanyId, editValues.client]);

    /**
     * handleCompanyChange
     * - When company changes, clear client selection.
     *
     * @function handleCompanyChange
     * @param {string} nextCompanyId
     * @returns {void}
     */
    const handleCompanyChange = useCallback((nextCompanyId) => {
        logger.info("Company selection changed", { nextCompanyId });

        if (nextCompanyId === "") {
            setEditValues((prev) => ({
                ...prev,
                companyId: "",
                client: "",
            }));
            return;
        }

        setEditValues((prev) => {
            const shouldClearClient = nextCompanyId !== prev.companyId;
            return {
                ...prev,
                companyId: nextCompanyId,
                client: shouldClearClient ? "" : prev.client,
            };
        });
    }, []);

    /**
     * handleClientChange
     * - Handles selecting or clearing a client.
     *
     * @function handleClientChange
     * @param {string} nextClient
     * @returns {void}
     */
    const handleClientChange = useCallback((nextClient) => {
        logger.info("Client selection changed", { nextClient });
        setEditValues((prev) => ({
            ...prev,
            client: nextClient,
        }));
    }, []);

    /**
     * createNewCompany
     * - Creates a new company from a name string.
     *
     * @function createNewCompany
     * @param {string} companyNameToCreate
     * @returns {void}
     */
    const createNewCompany = useCallback(
        (companyNameToCreate) => {
            const trimmed = safeStringTrim(companyNameToCreate);
            if (!trimmed) {
                logger.error("Cannot create company with empty name");
                return;
            }
            logger.info("Creating new company", { name: trimmed });
            createCompanyMutation.mutate({ name: trimmed });
        },
        [createCompanyMutation],
    );

    /**
     * createNewClient
     * - Uses a new client name (stored locally in editValues.client).
     * - Does NOT call an API because clients are derived from jobs.
     *
     * @function createNewClient
     * @param {string} clientName
     * @returns {void}
     */
    const createNewClient = useCallback(
        (clientName) => {
            const trimmed = safeStringTrim(clientName);
            if (!trimmed) {
                logger.error("Cannot use empty client name");
                return;
            }
            if (!selectedCompanyId) {
                logger.error("Cannot create client without a company selected");
                return;
            }

            logger.info("Using new client name for company (draft only)", {
                companyId: selectedCompanyId,
            });

            setEditValues((prev) => ({
                ...prev,
                client: trimmed,
            }));
        },
        [selectedCompanyId],
    );

    /**
     * selectedCompanyName
     * - Resolves company name for the selected companyId (edit mode only).
     *
     * @type {string}
     */
    const selectedCompanyName = useMemo(() => {
        if (!isEditMode) return "";

        const companyIdStr = normalizeIdToString(editValues.companyId);
        if (!companyIdStr) return "";

        const match = (Array.isArray(companies) ? companies : []).find(
            (c) => normalizeIdToString(c.id ?? c.companyId) === companyIdStr,
        );

        return match?.name || "";
    }, [isEditMode, editValues.companyId, companies]);

    /**
     * saveJobMutation
     * - Saves the edited job details to the server.
     */
    const saveJobMutation = useMutation({
        mutationFn: (updatedJobData) => {
            if (!job?.jobId) {
                throw new Error("Cannot save job without a valid jobId");
            }
            return updateJob(job.jobId, updatedJobData);
        },
        onSuccess: (savedJob) => {
            logger.info("Job saved successfully", { jobId: job?.jobId });

            // Refetch job details so view-mode fields (including updatedBy) refresh
            queryClient.invalidateQueries({ queryKey: jobKeys.all });

            // If server returns updatedBy, refresh that user too
            if (savedJob?.updatedBy) {
                queryClient.invalidateQueries({
                    queryKey: userKeys.detail(savedJob.updatedBy),
                });
            }

            // Clients list may change if we updated the client string
            if (selectedCompanyId) {
                queryClient.invalidateQueries({
                    queryKey: [...jobKeys.all, "clients", selectedCompanyId],
                });
            }

            setIsEditMode(false);
        },
        onError: (err) => {
            logger.error("Failed to save job", err);
        },
    });

    /**
     * saveJob
     * - Saves the current editValues to the server.
     * - Sets `updatedBy` from `useCurrentUser`.
     *
     * @function saveJob
     * @returns {void}
     */
    const saveJob = useCallback(() => {
        if (!job?.jobId) {
            logger.error("Cannot save job without a valid jobId");
            return;
        }

        const updatedById = resolveCurrentUserId(currentUser);
        if (!updatedById) {
            logger.error("Cannot save job: could not resolve current user id for updatedBy", {
                currentUserLoading,
                hasCurrentUser: Boolean(currentUser),
                currentUserError,
            });
            return;
        }

        const payload = {
            name: safeStringTrim(editValues.name),
            client: safeStringTrim(editValues.client),
            description: safeStringTrim(editValues.description),
            companyId: editValues.companyId ? Number(editValues.companyId) : null,
            updatedBy: updatedById,
        };

        logger.info("Saving job (payload redacted)");
        saveJobMutation.mutate(payload);
    }, [
        job,
        editValues,
        saveJobMutation,
        currentUser,
        currentUserLoading,
        currentUserError,
    ]);

    /**
     * hasChanges
     * - Returns true if editValues differ from the original job values.
     *
     * @type {boolean}
     */
    const hasChanges = useMemo(() => {
        if (!job) return false;
        const original = getInitialEditValuesFromJob(job);
        return (
            editValues.name !== original.name ||
            editValues.client !== original.client ||
            editValues.description !== original.description ||
            editValues.companyId !== original.companyId
        );
    }, [job, editValues]);

    return {
        isEditMode,
        editValues,
        toggleEditMode,
        updateEditField,
        handleCompanyChange,
        handleClientChange,
        createNewCompany,
        createNewClient,
        saveJob,
        hasChanges,
        companyOptions,
        clientOptions,
        selectedCompanyName,
        companiesState: {
            isCompaniesPending,
            isCompaniesError,
        },
        clientsState: {
            isClientsPending,
            isClientsError,
            refetchClients,
        },
        createCompanyState: {
            isPending: createCompanyMutation.isPending,
            isError: createCompanyMutation.isError,
            error: createCompanyMutation.error,
        },
        saveJobState: {
            isPending: saveJobMutation.isPending,
            isError: saveJobMutation.isError,
            error: saveJobMutation.error,
            isSuccess: saveJobMutation.isSuccess,
        },
        currentUserState: {
            loading: currentUserLoading,
            error: currentUserError,
        },
    };
};

export default useEditJobDetails;