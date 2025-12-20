/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen.
 *
 * Global vs local filtering rules:
 * - Initial filter(s) for company/status/client drive GLOBAL queries via getAllJobs(params).
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
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllJobs, searchJobs } from "../../../api/job/job";
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
 * @constant
 * @type {Array<{ key: string, label: string }>}
 */
const SORT_OPTIONS = [
    { key: "date-desc", label: "Newest" },
    { key: "date-asc", label: "Oldest" },
    { key: "modified-desc", label: "Date Modified" },
];

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
 *   global filters (company/status) and pagination/sort.
 *
 * @function buildGlobalJobParams
 * @param {object} args
 * @param {string} args.companyFilter - "all" or companyId string
 * @param {string} args.statusFilter - "all" or status string
 * @param {number} args.page - current page (1-based)
 * @param {number} args.pageSize - current page size
 * @param {{sortField:(string|undefined),sortOrder:('asc'|'desc'|undefined)}} args.sortParams
 * @returns {object} params for getAllJobs
 */
const buildGlobalJobParams = ({
                                  companyFilter,
                                  statusFilter,
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

    return params;
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

    /**
     * searchInput
     * - Current value in the search input field (NOT yet applied until Enter).
     *
     * @type {[string, Function]}
     */
    const [searchInput, setSearchInput] = useState("");

    /**
     * search
     * - Active search text that has been "applied" (e.g., via Enter key or client dropdown).
     *
     * @type {[string, Function]}
     */
    const [search, setSearch] = useState("");

    /**
     * sortKey
     * - Current sort key (one of SORT_OPTIONS keys).
     *
     * @type {[string, Function]}
     */
    const [sortKey, setSortKey] = useState("date-desc");

    /**
     * companyFilter
     * - "all" or a specific companyId (stringified).
     *
     * @type {[string, Function]}
     */
    const [companyFilter, setCompanyFilter] = useState("all");

    /**
     * statusFilter
     * - "all" or a specific job status string.
     *
     * @type {[string, Function]}
     */
    const [statusFilter, setStatusFilter] = useState("all");

    /**
     * clientFilter
     * - "all" or a specific client string.
     *
     * @type {[string, Function]}
     */
    const [clientFilter, setClientFilter] = useState("all");

    /**
     * page
     * - Current page index (1-based).
     *
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);

    /**
     * pageSize
     * - Current page size (default 50).
     *
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    /**
     * hasGlobalFilters
     * - Once true, indicates that a global filter/search has been executed.
     *   After this, additional filter changes become local only.
     *
     * @type {[boolean, Function]}
     */
    const [hasGlobalFilters, setHasGlobalFilters] = useState(false);

    /**
     * initialGlobalFilterSource
     * - Tracks which filter triggered the first global operation: "none" | "company" | "status" | "client".
     *
     * @type {[string, Function]}
     */
    const [initialGlobalFilterSource, setInitialGlobalFilterSource] = useState("none");

    /**
     * baseJobs
     * - Jobs returned from the base/global API calls (getAllJobs/searchJobs).
     *   This is the array that local filters operate on.
     *
     * @type {[Array, Function]}
     */
    const [baseJobs, setBaseJobs] = useState([]);

    /**
     * isBaseLoading
     * - Manual flag to represent loading state for global operations.
     *
     * @type {[boolean, Function]}
     */
    const [isBaseLoading, setIsBaseLoading] = useState(false);

    /**
     * baseError
     * - Error object (if any) for global operations.
     *
     * @type {[Error|null, Function]}
     */
    const [baseError, setBaseError] = useState(null);

    /**
     * sortParams
     * - Derived server-side sort parameters from sortKey.
     *
     * @type {{sortField: (string|undefined), sortOrder: ('asc'|'desc'|undefined)}}
     */
    const sortParams = useMemo(
        () => deriveSortParams(sortKey),
        [sortKey],
    );

    const trimmedSearch = search.trim();
    const trimmedSearchInput = searchInput.trim();

    // --- Base "all jobs" query (unfiltered) for initial load only ---

    /**
     * initialJobsQuery
     * - Loads all jobs once on mount before any global filters are applied.
     * - After hasGlobalFilters becomes true, this query is no longer used for UI data.
     */
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
            // getAllJobs now returns { status, data, meta, ... }
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("useJobScreen initial jobs queryFn success", {
                count: jobsArray.length,
            });
            return jobsArray;
        },
    });

    /**
     * sync baseJobs from initial query when there are no global filters yet.
     */
    useEffect(() => {
        if (!hasGlobalFilters && Array.isArray(initialJobsResponse)) {
            setBaseJobs(initialJobsResponse);
        }
    }, [hasGlobalFilters, initialJobsResponse]);

    // --- Global operations: getAllJobs & searchJobs (imperative) ---

    /**
     * applyGlobalCompanyStatusFilter
     * - Executes a global getAllJobs call based on current company/status filters.
     * - Used when initial filter is company or status, and in the edge case when
     *   both are applied in sequence.
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
                page,
                pageSize,
                sortParams,
            });

            logger.info("useJobScreen applyGlobalCompanyStatusFilter getAllJobs called", params);
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
     * - Executes a global searchJobs call using the client name as `q`.
     * - Also sets the search bar value to that client name and applies it as the active search.
     *
     * @async
     * @function applyGlobalClientSearch
     * @param {string} clientName - Client string selected from dropdown.
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

            logger.info("useJobScreen applyGlobalClientSearch searchJobs called", params);

            const response = await searchJobs(params);
            const jobsArray = Array.isArray(response?.data) ? response.data : [];

            setBaseJobs(jobsArray);
            setHasGlobalFilters(true);

            // Populate the search bar with the client name and mark it as the active search text.
            setSearchInput(q);
            setSearch(q);
        } catch (error) {
            logger.error("useJobScreen applyGlobalClientSearch failed", error);
            setBaseError(error);
        } finally {
            setIsBaseLoading(false);
        }
    };

    // --- Hook consumers will call these setters directly; we add effects to detect "initial global" logic ---

    /**
     * Effect: when companyFilter or statusFilter changes, decide if this should trigger
     * the initial (or edge-case) global getAllJobs call.
     *
     * Rules:
     * - If no global filters have been applied yet (hasGlobalFilters === false):
     *    - If companyFilter != "all" OR statusFilter != "all": trigger global getAllJobs.
     *    - initialGlobalFilterSource will be:
     *        - "company" if companyFilter changed from "all" to a value.
     *        - "status"  if statusFilter  changed from "all" to a value.
     * - Edge case:
     *    - If initialGlobalFilterSource is "company" and then statusFilter changes from "all" to something,
     *      trigger another global getAllJobs (now with both companyId & status).
     *    - If initialGlobalFilterSource is "status" and then companyFilter changes, same rule.
     */
    useEffect(() => {
        // No-op until the initial jobs query has resolved at least once.
        if (isPendingInitial) return;

        const isCompanyActive = companyFilter !== "all";
        const isStatusActive = statusFilter !== "all";

        // First time any of the global filters gets activated.
        if (!hasGlobalFilters && (isCompanyActive || isStatusActive)) {
            const source = isCompanyActive && !isStatusActive ? "company"
                : !isCompanyActive && isStatusActive ? "status"
                    : isCompanyActive && isStatusActive ? "company-status"
                        : "none";

            logger.info("useJobScreen initial global filter activation", {
                companyFilter,
                statusFilter,
                source,
            });

            setInitialGlobalFilterSource(source);
            // Reset pagination to the first page on initial global filter.
            setPage(1);

            // Global call based on current filters.
            applyGlobalCompanyStatusFilter();
            return;
        }

        // Edge-case: after initial global filter from company, user adds status (or vice versa).
        if (hasGlobalFilters) {
            const source = initialGlobalFilterSource;

            const shouldEdgeRequeryFromCompany =
                source === "company" && isCompanyActive && isStatusActive;

            const shouldEdgeRequeryFromStatus =
                source === "status" && isCompanyActive && isStatusActive;

            if (shouldEdgeRequeryFromCompany || shouldEdgeRequeryFromStatus) {
                logger.info("useJobScreen edge global requery (company+status)", {
                    companyFilter,
                    statusFilter,
                    source,
                });
                setPage(1);
                applyGlobalCompanyStatusFilter();
            }
        }

    }, [companyFilter, statusFilter, isPendingInitial]);

    /**
     * Effect: when clientFilter changes from "all" to a real client and no global
     * filters have been applied yet, perform a global search via searchJobs(q=clientName).
     *
     * After this initial client-based global search, additional filter changes
     * become local only.
     */
    useEffect(() => {
        if (isPendingInitial) return;

        const isClientActive = clientFilter !== "all";

        if (!hasGlobalFilters && isClientActive) {
            logger.info("useJobScreen initial global filter via client", {
                clientFilter,
            });
            setInitialGlobalFilterSource("client");
            setPage(1);
            applyGlobalClientSearch(clientFilter);
        }

    }, [clientFilter, isPendingInitial]);

    // --- Combined jobs collection used for local filters & sorting ---

    /**
     * jobs
     * - Active job collection used for local filtering & rendering.
     *   - Before global filters: initialJobsResponse (base list from getAllJobs()).
     *   - After global filters: baseJobs (from getAllJobs/searchJobs with params).
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
     * - Controls top-level loading state.
     * - Pending when initial list is loading OR a global re-query is in flight.
     *
     * @type {boolean}
     */
    const isPending = isPendingInitial || isBaseLoading;

    /**
     * isError
     * - Combined error flag that prefers base/global error, else initial query error.
     *
     * @type {boolean}
     */
    const isError = Boolean(baseError || (hasGlobalFilters ? baseError : errorInitial));

    /**
     * error
     * - Combined error object from global or initial queries.
     *
     * @type {Error | null | undefined}
     */
    const error = baseError || errorInitial;

    // --- Options for dropdowns (derived from current jobs set) ---

    /**
     * sortOptionsForDropdown
     * - Sort options mapped into FilterDropdown shape.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const sortOptionsForDropdown = useMemo(
        () => SORT_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label })),
        [],
    );

    /**
     * companyOptions
     * - Unique companyId values for Company filter dropdown.
     *   After global filters, this is still derived from the current jobs array,
     *   making subsequent selections "local".
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        const setCompanyIds = new Set();
        (jobs || []).forEach((job) => {
            if (job.companyId !== null && job.companyId !== undefined) {
                setCompanyIds.add(String(job.companyId));
            }
        });

        return [
            { value: "all", label: "All" },
            ...Array.from(setCompanyIds)
                .sort((a, b) => Number(a) - Number(b))
                .map((id) => ({ value: id, label: id })),
        ];
    }, [jobs]);

    /**
     * clientOptions
     * - Unique client values for Client filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
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

    /**
     * statusOptions
     * - Unique status values for Status filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
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

    /**
     * filteredAndSortedJobs
     * - Applies local search (searchInput/search), local filters, and local sort.
     * - Global queries already constrain `jobs` by company/status/client; after that
     *   all remaining filters are only applied locally over `jobs`.
     *
     * @type {Array}
     */
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

    /**
     * totalJobs
     * - Total count after local filtering.
     *
     * @type {number}
     */
    const totalJobs = filteredAndSortedJobs.length;

    /**
     * totalPages
     * - Total pages given current pageSize and totalJobs.
     *
     * @type {number}
     */
    const totalPages = useMemo(() => {
        if (totalJobs === 0) return 1;
        return Math.max(1, Math.ceil(totalJobs / pageSize));
    }, [totalJobs, pageSize]);

    /**
     * currentPage
     * - Page number clamped to valid range (1..totalPages).
     *
     * @type {number}
     */
    const currentPage = useMemo(() => {
        if (page < 1) return 1;
        if (page > totalPages) return totalPages;
        return page;
    }, [page, totalPages]);

    /**
     * paginatedJobs
     * - Slice filteredAndSortedJobs for current page.
     *
     * @type {Array}
     */
    const paginatedJobs = useMemo(() => {
        if (filteredAndSortedJobs.length === 0) return [];
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAndSortedJobs.slice(start, end);
    }, [filteredAndSortedJobs, currentPage, pageSize]);

    /**
     * handleResetFilters
     * - Resets filters, search text, sort, pagination, and global state to defaults.
     *   Also clears any cached global-job specific queries to avoid stale data.
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
        setSortKey("date-desc");
        setPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");
        setBaseJobs(Array.isArray(initialJobsResponse) ? initialJobsResponse : []);
        setBaseError(null);
        setIsBaseLoading(false);

        // Optional: invalidate global search/list cache so next interaction refetches fresh data.
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
        search, // applied search text
        searchInput, // live text in input field
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        page,
        pageSize,
        hasGlobalFilters,
        initialGlobalFilterSource,

        // setters / actions
        setSearch, // apply search (used on Enter)
        setSearchInput, // update text as user types
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