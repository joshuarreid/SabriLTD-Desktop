/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen.
 *
 * Global vs local filtering rules:
 * - Initial filter(s) for company/status/client drive GLOBAL queries via getAllJobs/searchJobs.
 * - After the initial global filter set, remaining filters become LOCAL (client-side)
 *   and operate only on the currently loaded job set.
 *
 * Global behavior:
 * - If company is chosen first: call getAllJobs({ companyId, ...status? })
 * - If status is chosen first:  call getAllJobs({ status, ...companyId? })
 * - If client is chosen first:
 *    - Trigger global search via searchJobs({ q: clientName })
 *    - Populate the search bar with that clientName
 * - Edge case:
 *    - If initial filter is company then status (or vice versa), perform another
 *      GLOBAL getAllJobs with both { companyId, status }.
 *
 * Local behavior:
 * - After the initial global filter combination has been applied, further
 *   changes to filters are treated as LOCAL filters over the current `jobs`
 *   array (no additional getAllJobs/searchJobs calls).
 *
 * Performance / UX:
 * - Avoids full-screen remounts or "flashing" by:
 *   - Using React Query only for the initial all‑jobs load (and unique companies).
 *   - Running subsequent global filter/search calls imperatively and updating
 *     a local jobs array instead of toggling query `enabled` flags.
 *   - Exposing a lightweight `isPending` flag to the UI so only the grid
 *     shows a subtle loading state while animations handle card transitions.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllJobs, searchJobs, getJobCompanies } from "../../../api/job/job";
import { jobKeys } from "../../../api/job/jobQueryKeys";

/**
 * logger for useJobScreen hook.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useJobScreen]", ...args),
    error: (...args) => console.error("[useJobScreen]", ...args),
};

/**
 * SORT_OPTIONS
 * - Sort options for the "Sort by" dropdown.
 *
 * NOTE: Default UI sort is now "Date Modified" (modified-desc).
 *
 * @constant
 * @type {Array<{ key: string, label: string }>}
 */
const SORT_OPTIONS = [
    { key: "modified-desc", label: "Date Modified" },
    { key: "date-desc", label: "Newest" },
    { key: "date-asc", label: "Oldest" },
];

/**
 * DEFAULT_SORT_KEY
 * - Default sort key applied on initial load and when clearing filters.
 *   Per requirements, this is "Date Modified" (modified-desc), not "Newest".
 *
 * @constant
 * @type {string}
 */
const DEFAULT_SORT_KEY = "modified-desc";

/**
 * DEFAULT_PAGE_SIZE
 * - Default number of jobs per page for JobScreen pagination.
 *
 * @constant
 * @type {number}
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * deriveSortParams
 * Maps internal sortKey to API sort parameters for the global getAllJobs/searchJobs endpoints.
 *
 * @function deriveSortParams
 * @param {string} sortKey - Current sort key (e.g., "date-desc", "modified-desc").
 * @returns {{ sortField: (string|undefined), sortOrder: ('asc'|'desc'|undefined) }} Derived sort field and order.
 */
const deriveSortParams = (sortKey) => {
    if (!sortKey) return { sortField: undefined, sortOrder: undefined };

    const [field, dirRaw] = String(sortKey).split("-");
    const dir = dirRaw === "asc" ? "asc" : "desc";

    if (field === "date") {
        return { sortField: "dateAdded", sortOrder: dir };
    }
    if (field === "modified") {
        return { sortField: "dateUpdated", sortOrder: dir };
    }

    // Fallback: allow backend to use its own default sort
    return { sortField: undefined, sortOrder: undefined };
};

/**
 * buildGlobalJobParams
 * - Builds the query params object for getAllJobs based on the current
 *   global filters (company/status/client) and pagination/sort.
 *
 * @function buildGlobalJobParams
 * @param {object} args
 * @param {string} args.companyFilter - "all" or companyId string
 * @param {string} args.statusFilter - "all" or status string
 * @param {string} args.clientFilter - "all" or client string
 * @param {number} args.page - current page (1-based)
 * @param {number} args.pageSize - current page size
 * @param {{sortField:(string|undefined),sortOrder:('asc'|'desc'|undefined)}} args.sortParams
 * @returns {object} params for getAllJobs
 */
const buildGlobalJobParams = ({
                                  companyFilter,
                                  statusFilter,
                                  clientFilter,
                                  page,
                                  pageSize,
                                  sortParams,
                              }) => {
    const params = {
        page,
        size: pageSize,
    };

    if (sortParams.sortField) {
        params.sortField = sortParams.sortField;
    }
    if (sortParams.sortOrder) {
        params.sortOrder = sortParams.sortOrder;
    }

    if (companyFilter && companyFilter !== "all") {
        params.companyId = Number(companyFilter);
    }

    if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
    }

    if (clientFilter && clientFilter !== "all") {
        params.client = clientFilter;
    }

    return params;
};

/**
 * handleCompanyStatusGlobalEffect
 * - Pure helper for the company/status global effect to keep the
 *   React hook dependency list small and avoid inline logic.
 *
 * @function handleCompanyStatusGlobalEffect
 * @param {object} params - Effect parameters
 * @param {boolean} params.isReady - True when initial query has finished.
 * @param {boolean} params.hasGlobalFiltersValue - Current hasGlobalFilters.
 * @param {string} params.companyFilterValue - Current companyFilter.
 * @param {string} params.statusFilterValue - Current statusFilter.
 * @param {string} params.initialSource - Current initialGlobalFilterSource.
 * @param {Function} params.setInitialSource - Setter for initialGlobalFilterSource.
 * @param {Function} params.setPageFn - Setter for page.
 * @param {Function} params.applyGlobalFn - Global apply function.
 * @returns {void}
 */
const handleCompanyStatusGlobalEffect = ({
                                             isReady,
                                             hasGlobalFiltersValue,
                                             companyFilterValue,
                                             statusFilterValue,
                                             initialSource,
                                             setInitialSource,
                                             setPageFn,
                                             applyGlobalFn,
                                         }) => {
    if (!isReady) return;

    const isCompanyActive = companyFilterValue !== "all";
    const isStatusActive = statusFilterValue !== "all";

    // First time any of the global filters gets activated.
    if (!hasGlobalFiltersValue && (isCompanyActive || isStatusActive)) {
        const source =
            isCompanyActive && !isStatusActive
                ? "company"
                : !isCompanyActive && isStatusActive
                    ? "status"
                    : isCompanyActive && isStatusActive
                        ? "company-status"
                        : "none";

        logger.info("useJobScreen initial global filter activation", {
            companyFilter: companyFilterValue,
            statusFilter: statusFilterValue,
            source,
        });

        setInitialSource(source);
        setPageFn(1);
        applyGlobalFn();
        return;
    }

    // Edge-case: after initial global filter from company, user adds status (or vice versa).
    if (hasGlobalFiltersValue) {
        const source = initialSource;

        const shouldEdgeRequeryFromCompany =
            source === "company" && isCompanyActive && isStatusActive;

        const shouldEdgeRequeryFromStatus =
            source === "status" && isCompanyActive && isStatusActive;

        if (shouldEdgeRequeryFromCompany || shouldEdgeRequeryFromStatus) {
            logger.info("useJobScreen edge global requery (company+status)", {
                companyFilter: companyFilterValue,
                statusFilter: statusFilterValue,
                source,
            });
            setPageFn(1);
            applyGlobalFn();
        }
    }
};

/**
 * handleClientGlobalEffect
 * - Pure helper for the client global effect.
 *
 * @function handleClientGlobalEffect
 * @param {object} params - Effect parameters
 * @param {boolean} params.isReady - True when initial query has finished.
 * @param {boolean} params.hasGlobalFiltersValue - Current hasGlobalFilters.
 * @param {string} params.clientFilterValue - Current clientFilter.
 * @param {Function} params.setInitialSource - Setter for initialGlobalFilterSource.
 * @param {Function} params.setPageFn - Setter for page.
 * @param {Function} params.applyGlobalClientFn - Global client search function.
 * @returns {void}
 */
const handleClientGlobalEffect = ({
                                      isReady,
                                      hasGlobalFiltersValue,
                                      clientFilterValue,
                                      setInitialSource,
                                      setPageFn,
                                      applyGlobalClientFn,
                                  }) => {
    if (!isReady) return;

    const isClientActive = clientFilterValue !== "all";

    if (!hasGlobalFiltersValue && isClientActive) {
        logger.info("useJobScreen initial global filter via client", {
            clientFilter: clientFilterValue,
        });
        setInitialSource("client");
        setPageFn(1);
        applyGlobalClientFn(clientFilterValue);
    }
};

/**
 * useJobScreen
 *
 * Main hook encapsulating data fetching, global search, filters, sort,
 * and pagination behavior for the jobs screen.
 *
 * @function useJobScreen
 * @returns {object} Hook API consumed by JobScreen.jsx.
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");
    const queryClient = useQueryClient();

    // --- Local UI state ---

    /** @type {[string, Function]} */
    const [searchInput, setSearchInput] = useState("");

    /** @type {[string, Function]} */
    const [search, setSearch] = useState("");

    /**
     * sortKey
     * - Default sort is "Date Modified" as requested.
     *
     * @type {[string, Function]}
     */
    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    /** @type {[string, Function]} */
    const [companyFilter, setCompanyFilter] = useState("all");

    /** @type {[string, Function]} */
    const [statusFilter, setStatusFilter] = useState("all");

    /** @type {[string, Function]} */
    const [clientFilter, setClientFilter] = useState("all");

    /** @type {[number, Function]} */
    const [page, setPage] = useState(1);

    /** @type {[number, Function]} */
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    /** @type {[boolean, Function]} */
    const [hasGlobalFilters, setHasGlobalFilters] = useState(false);

    /** @type {[string, Function]} */
    const [initialGlobalFilterSource, setInitialGlobalFilterSource] =
        useState("none");

    /** @type {[Array, Function]} */
    const [baseJobs, setBaseJobs] = useState([]);

    /** @type {[boolean, Function]} */
    const [isBaseLoading, setIsBaseLoading] = useState(false);

    /** @type {[Error|null, Function]} */
    const [baseError, setBaseError] = useState(null);

    /** @type {{sortField:(string|undefined),sortOrder:('asc'|'desc'|undefined)}} */
    const sortParams = useMemo(
        () => deriveSortParams(sortKey),
        [sortKey],
    );

    const trimmedSearch = search.trim();
    const trimmedSearchInput = searchInput.trim();

    // --- Base "all jobs" query (unfiltered) for initial load only ---

    const {
        data: initialJobsResponse,
        isPending: isPendingInitial,
        isError: isErrorInitial,
        error: errorInitial,
    } = useQuery({
        queryKey: jobKeys.lists(),
        queryFn: async () => {
            logger.info("useJobScreen initial jobs queryFn called");
            const response = await getAllJobs();
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("useJobScreen initial jobs queryFn success", {
                count: jobsArray.length,
            });
            return jobsArray;
        },
    });

    /**
     * uniqueCompaniesQuery
     * - Loads the de-duplicated list of companies that have at least one job.
     */
    const {
        data: uniqueCompanies = [],
        isError: isErrorCompanies,
        error: errorCompanies,
    } = useQuery({
        queryKey: jobKeys.companies(),
        queryFn: async () => {
            logger.info("useJobScreen uniqueCompanies queryFn called");
            const companies = await getJobCompanies();
            logger.info("useJobScreen uniqueCompanies queryFn success", {
                count: Array.isArray(companies) ? companies.length : 0,
            });
            return companies;
        },
    });

    useEffect(() => {
        if (!hasGlobalFilters && Array.isArray(initialJobsResponse)) {
            setBaseJobs(initialJobsResponse);
        }
    }, [hasGlobalFilters, initialJobsResponse]);

    // --- Global operations: getAllJobs & searchJobs (imperative) ---

    /**
     * applyGlobalCompanyStatusFilter
     *
     * @async
     * @function applyGlobalCompanyStatusFilter
     * @returns {Promise<void>}
     */
    const applyGlobalCompanyStatusFilter = async () => {
        try {
            setIsBaseLoading(true);
            setBaseError(null);

            const params = buildGlobalJobParams({
                companyFilter,
                statusFilter,
                clientFilter: "all",
                page,
                pageSize,
                sortParams,
            });

            logger.info(
                "useJobScreen applyGlobalCompanyStatusFilter getAllJobs called",
                params,
            );
            const response = await getAllJobs(params);
            const jobsArray = Array.isArray(response?.data) ? response.data : [];

            setBaseJobs(jobsArray);
            setHasGlobalFilters(true);
        } catch (error) {
            logger.error("useJobScreen applyGlobalCompanyStatusFilter failed", error);
            setBaseError(error);
        } finally {
            setIsBaseLoading(false);
        }
    };

    /**
     * applyGlobalClientSearch
     *
     * @async
     * @function applyGlobalClientSearch
     * @param {string} clientName
     * @returns {Promise<void>}
     */
    const applyGlobalClientSearch = async (clientName) => {
        const q = String(clientName || "").trim();
        if (!q) {
            return;
        }

        try {
            setIsBaseLoading(true);
            setBaseError(null);

            const params = {
                q,
                page,
                size: pageSize,
                sortField: sortParams.sortField,
                sortOrder: sortParams.sortOrder,
            };

            logger.info(
                "useJobScreen applyGlobalClientSearch searchJobs called",
                params,
            );

            const response = await searchJobs(params);
            const jobsArray = Array.isArray(response?.data) ? response.data : [];

            setBaseJobs(jobsArray);
            setHasGlobalFilters(true);

            setSearchInput(q);
            setSearch(q);
        } catch (error) {
            logger.error("useJobScreen applyGlobalClientSearch failed", error);
            setBaseError(error);
        } finally {
            setIsBaseLoading(false);
        }
    };

    // --- Effects wiring the global logic ---

    useEffect(() => {
        handleCompanyStatusGlobalEffect({
            isReady: !isPendingInitial,
            hasGlobalFiltersValue: hasGlobalFilters,
            companyFilterValue: companyFilter,
            statusFilterValue: statusFilter,
            initialSource: initialGlobalFilterSource,
            setInitialSource: setInitialGlobalFilterSource,
            setPageFn: setPage,
            applyGlobalFn: applyGlobalCompanyStatusFilter,
        });
    }, [
        companyFilter,
        statusFilter,
        isPendingInitial,
        hasGlobalFilters,
        initialGlobalFilterSource,
    ]);

    useEffect(() => {
        handleClientGlobalEffect({
            isReady: !isPendingInitial,
            hasGlobalFiltersValue: hasGlobalFilters,
            clientFilterValue: clientFilter,
            setInitialSource: setInitialGlobalFilterSource,
            setPageFn: setPage,
            applyGlobalClientFn: applyGlobalClientSearch,
        });
    }, [clientFilter, isPendingInitial, hasGlobalFilters]);

    // --- Combined jobs collection used for local filters & sorting ---

    /**
     * jobs
     *
     * @type {Array}
     */
    const jobs = useMemo(() => {
        if (hasGlobalFilters) {
            return Array.isArray(baseJobs) ? baseJobs : [];
        }
        return Array.isArray(initialJobsResponse) ? initialJobsResponse : [];
    }, [hasGlobalFilters, baseJobs, initialJobsResponse]);

    /**
     * isPending
     *
     * @type {boolean}
     */
    const isPending = isPendingInitial || isBaseLoading;

    /**
     * isError
     *
     * @type {boolean}
     */
    const isError = Boolean(
        baseError || (!hasGlobalFilters && isErrorInitial) || isErrorCompanies,
    );

    /**
     * error
     *
     * @type {Error | null | undefined}
     */
    const error = baseError || errorInitial || errorCompanies;

    // --- Options for dropdowns ---

    /** @type {Array<{value:string,label:string}>} */
    const sortOptionsForDropdown = useMemo(
        () => SORT_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label })),
        [],
    );

    /**
     * companyOptions
     * - Built from UniqueCompanyResponse list.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        if (!Array.isArray(uniqueCompanies) || uniqueCompanies.length === 0) {
            return [{ value: "all", label: "All Companies" }];
        }

        const sorted = [...uniqueCompanies].sort((a, b) =>
            String(a.companyName || "").localeCompare(String(b.companyName || "")),
        );

        return [
            { value: "all", label: "All Companies" },
            ...sorted.map((company) => ({
                value: String(company.companyId),
                label: company.companyName,
            })),
        ];
    }, [uniqueCompanies]);

    /** @type {Array<{value:string,label:string}>} */
    const clientOptions = useMemo(() => {
        const setClients = new Set();
        (jobs || []).forEach((job) => {
            if (job.client) {
                setClients.add(job.client);
            }
        });

        return [
            { value: "all", label: "All" },
            ...Array.from(setClients)
                .sort()
                .map((client) => ({ value: client, label: client })),
        ];
    }, [jobs]);

    /** @type {Array<{value:string,label:string}>} */
    const statusOptions = useMemo(() => {
        const setStatus = new Set();
        (jobs || []).forEach((job) => {
            if (job.status) {
                setStatus.add(job.status);
            }
        });
        return [
            { value: "all", label: "All" },
            ...Array.from(setStatus)
                .sort()
                .map((s) => ({ value: s, label: s })),
        ];
    }, [jobs]);

    // --- Derived data: filters, sort, pagination ---

    /** @type {Array} */
    const filteredAndSortedJobs = useMemo(() => {
        if (!Array.isArray(jobs) || jobs.length === 0) return [];

        const q = trimmedSearch.toLowerCase();

        const baseFiltered = jobs.filter((job) => {
            const matchesSearch =
                !q ||
                String(job.name || "").toLowerCase().includes(q) ||
                String(job.client || "").toLowerCase().includes(q) ||
                String(job.status || "").toLowerCase().includes(q) ||
                String(job.description || "").toLowerCase().includes(q);

            const matchesCompany =
                companyFilter === "all" ||
                String(job.companyId ?? "") === companyFilter;

            const matchesClient =
                clientFilter === "all" || job.client === clientFilter;

            const matchesStatus =
                statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesCompany && matchesClient && matchesStatus;
        });

        const [field, dirRaw] = String(sortKey || "").split("-");
        const dir = dirRaw || "desc";
        const result = [...baseFiltered];

        result.sort((a, b) => {
            if (field === "date") {
                const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
                const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
                return dir === "asc" ? da - db : db - da;
            }
            if (field === "modified") {
                const modifiedA = a.dateUpdated || a.dateAdded;
                const modifiedB = b.dateUpdated || b.dateAdded;
                const da = modifiedA ? new Date(modifiedA).getTime() : 0;
                const db = modifiedB ? new Date(modifiedB).getTime() : 0;
                return dir === "asc" ? da - db : db - da;
            }
            const aa = String(a.name || "").toLowerCase();
            const bb = String(b.name || "").toLowerCase();
            return dir === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
        });

        return result;
    }, [
        jobs,
        trimmedSearch,
        companyFilter,
        clientFilter,
        statusFilter,
        sortKey,
    ]);

    /** @type {number} */
    const totalJobs = filteredAndSortedJobs.length;

    /** @type {number} */
    const totalPages = useMemo(() => {
        if (totalJobs === 0) return 1;
        return Math.max(1, Math.ceil(totalJobs / pageSize));
    }, [totalJobs, pageSize]);

    /** @type {number} */
    const currentPage = useMemo(() => {
        if (page < 1) return 1;
        if (page > totalPages) return totalPages;
        return page;
    }, [page, totalPages]);

    /** @type {Array} */
    const paginatedJobs = useMemo(() => {
        if (filteredAndSortedJobs.length === 0) return [];
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAndSortedJobs.slice(start, end);
    }, [filteredAndSortedJobs, currentPage, pageSize]);

    /**
     * handleResetFilters
     *
     * @function handleResetFilters
     * @returns {void}
     */
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters");
        setSearchInput("");
        setSearch("");
        setCompanyFilter("all");
        setClientFilter("all");
        setStatusFilter("all");
        setSortKey(DEFAULT_SORT_KEY);
        setPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");
        setBaseJobs(Array.isArray(initialJobsResponse) ? initialJobsResponse : []);
        setBaseError(null);
        setIsBaseLoading(false);

        queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        queryClient.invalidateQueries({ queryKey: jobKeys.search() });
    };

    // --- Public API ---

    return {
        // query base
        jobs,
        isPending,
        isError,
        error,

        // state
        search,
        searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        page,
        pageSize,
        hasGlobalFilters,
        initialGlobalFilterSource,

        // setters / actions
        setSearch,
        setSearchInput,
        setSortKey,
        setCompanyFilter,
        setClientFilter,
        setStatusFilter,
        setPage,
        setPageSize,

        // dropdown options
        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,

        // derived lists
        filteredAndSortedJobs,
        paginatedJobs,

        // pagination meta
        totalJobs,
        totalPages,
        currentPage,

        // actions
        handleResetFilters,
    };
};

export default useJobScreen;