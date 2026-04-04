import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCompanies, createCompany } from "../../../api/company/company";
import { getJobClients } from "../../../api/job/job";
import { companyKeys } from "../../../api/company/companyQueryKeys";
import { jobKeys } from "../../../api/job/jobQueryKeys";

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
 * useEditJobDetails
 * - Manages edit mode state for job details and related dropdown data (companies + clients).
 * - Owns editValues, edit-mode toggling, and "create new company/client" behaviors.
 *
 * NOTE:
 * - Saving the edited job itself is intentionally not handled here (UI feature can be added later).
 *
 * @function useEditJobDetails
 * @param {object} params
 * @param {any} params.job - The loaded job object (source of truth for initial values).
 * @returns {object} Edit model used by JobDetailScreen.
 */
const useEditJobDetails = ({ job }) => {
    logger.info("useEditJobDetails initialized", { jobId: job?.jobId });

    const queryClient = useQueryClient();

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
     * - When leaving (cancel), resets draft to job values.
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

            if (prev === true && next === false) {
                setEditValues(getInitialEditValuesFromJob(job));
            }

            if (prev === false && next === true) {
                setEditValues(getInitialEditValuesFromJob(job));
            }

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
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => buildCompanyOptions(companies), [companies]);

    /**
     * clientOptions
     * @type {Array<{value:string,label:string}>}
     */
    const clientOptions = useMemo(() => {
        if (!selectedCompanyId) return [];
        return buildClientOptions(clients);
    }, [clients, selectedCompanyId]);

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
            const trimmed = String(companyNameToCreate || "").trim();
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
     *
     * @function createNewClient
     * @param {string} clientName
     * @returns {void}
     */
    const createNewClient = useCallback(
        (clientName) => {
            const trimmed = String(clientName || "").trim();
            if (!trimmed) {
                logger.error("Cannot use empty client name");
                return;
            }
            if (!selectedCompanyId) {
                logger.error("Cannot create client without a company selected");
                return;
            }

            logger.info("Using new client name for company", {
                clientName: trimmed,
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

    return {
        isEditMode,
        editValues,
        toggleEditMode,
        updateEditField,
        handleCompanyChange,
        handleClientChange,
        createNewCompany,
        createNewClient,
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
    };
};

export default useEditJobDetails;