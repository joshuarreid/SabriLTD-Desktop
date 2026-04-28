import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCompanies, createCompany } from "../../../api/company/company.js";
import { getJobClients, updateJob } from "../../../api/job/job.js";
import { companyKeys } from "../../../api/company/companyQueryKeys.js";
import { jobKeys } from "../../../api/job/jobQueryKeys.js";
import { userKeys } from "../../../api/user/userQueryKeys.js";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser.js";

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
 * safeStringTrim
 * - Normalizes possibly-null values into trimmed strings.
 *
 * @function safeStringTrim
 * @param {any} value
 * @returns {string}
 */
const safeStringTrim = (value) => String(value || "").trim();

/**
 * resolveCurrentUserId
 * - Resolves a numeric user id from the `useCurrentUser` payload.
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
 * buildCompanyOptions
 * - Builds options for company dropdowns from companies list.
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
 * - Builds unique, sorted client options from API response.
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
 * useEditJobDetails
 * - Edit-mode view model for JobDetailScreen.
 *
 * @function useEditJobDetails
 * @param {object} params
 * @param {any} params.job
 * @returns {object}
 */
const useEditJobDetails = ({ job }) => {
    logger.info("useEditJobDetails initialized", { jobId: job?.jobId });

    const queryClient = useQueryClient();

    /**
     * Current authenticated user used to populate updatedBy.
     */
    const { user: currentUser, loading: currentUserLoading, error: currentUserError } =
        useCurrentUser();

    const [isEditMode, setIsEditMode] = useState(false);

    const [editValues, setEditValues] = useState(() => getInitialEditValuesFromJob(job));

    useEffect(() => {
        if (!job) return;
        if (!isEditMode) return;

        logger.info("Syncing editValues from job while in edit mode", {
            jobId: job?.jobId,
            companyId: job?.companyId,
        });

        setEditValues(getInitialEditValuesFromJob(job));
    }, [job, isEditMode]);

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

    const updateEditField = useCallback((field, nextValue) => {
        setEditValues((prev) => ({
            ...prev,
            [field]: nextValue,
        }));
    }, []);

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

    const selectedCompanyId = editValues.companyId;

    const {
        data: clients = [],
        isPending: isClientsPending,
        isError: isClientsError,
        refetch: refetchClients,
    } = useQuery({
        queryKey: jobKeys.clientsList({ companyId: selectedCompanyId }),
        queryFn: () => getJobClients({ companyId: selectedCompanyId }),
        enabled: isEditMode && Boolean(selectedCompanyId),
        staleTime: 5 * 60 * 1000,
    });

    const companyOptions = useMemo(() => buildCompanyOptions(companies), [companies]);

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

    const handleClientChange = useCallback((nextClient) => {
        logger.info("Client selection changed", { nextClient });
        setEditValues((prev) => ({
            ...prev,
            client: nextClient,
        }));
    }, []);

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
     * - Update job on server.
     */
    const saveJobMutation = useMutation({
        mutationFn: (updatedJobData) => {
            if (!job?.jobId) {
                throw new Error("Cannot save job without a valid jobId");
            }
            return updateJob(job.jobId, updatedJobData);
        },
        onSuccess: async (savedJob) => {
            logger.info("Job saved successfully", { jobId: job?.jobId });

            try {
                /**
                 * ✅ Fix #1:
                 * Invalidate JobScreen caches so name/description changes are reflected
                 * in lists/search immediately.
                 */
                await Promise.all([
                    // detail screen cache
                    job?.jobId
                        ? queryClient.invalidateQueries({
                            queryKey: jobKeys.detail(job.jobId),
                        })
                        : Promise.resolve(),

                    // job screen caches
                    queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
                    queryClient.invalidateQueries({ queryKey: jobKeys.search() }),

                    // client lists (safe; client can be updated)
                    queryClient.invalidateQueries({ queryKey: jobKeys.clients() }),

                    // company-scoped client list currently in use (if applicable)
                    selectedCompanyId
                        ? queryClient.invalidateQueries({
                            queryKey: jobKeys.clientsList({ companyId: selectedCompanyId }),
                        })
                        : Promise.resolve(),

                    // user detail cache for updatedBy display
                    savedJob?.updatedBy
                        ? queryClient.invalidateQueries({
                            queryKey: userKeys.detail(savedJob.updatedBy),
                        })
                        : Promise.resolve(),
                ]);
            } catch (err) {
                logger.error("Failed to invalidate queries after saving job", err);
            }

            setIsEditMode(false);
        },
        onError: (err) => {
            logger.error("Failed to save job", err);
        },
    });

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

        logger.info("Saving job");
        saveJobMutation.mutate(payload);
    }, [job, editValues, saveJobMutation, currentUser, currentUserLoading, currentUserError]);

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

