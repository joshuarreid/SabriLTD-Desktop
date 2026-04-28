// Job-related TypeScript types and interfaces

export interface Job {
    jobId?: number;
    name: string;
    [key: string]: any;
}

export interface JobResponse {
    status?: string;
    data?: Job | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface JobListResponse {
    status?: string;
    data: Job[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

