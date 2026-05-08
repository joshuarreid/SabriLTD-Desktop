/**
 * Company-related TypeScript types and interfaces
 */

export interface Company {
    companyId?: number;
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    [key: string]: any;
}

export interface CompanyResponse {
    status?: string;
    data?: Company | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface CompanyListResponse {
    status?: string;
    data: Company[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface CompanyWithJobs extends Company {
    jobs?: any[];
}

export interface CompanyWithJobsListResponse {
    status?: string;
    data: CompanyWithJobs[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

