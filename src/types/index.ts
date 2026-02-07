export interface DeedRecord {
    _id?: string;
    id?: string; // Optional for backend response compatibility
    landTitleNumber: string;
    deedNumber: string;
    ownerName: string;
    ownerNIC: string;
    landLocation: string;
    district: string;
    province: string;
    landArea: string;
    surveyRef: string;
    registrationDate: string;
    lastVerified: string;
    blockchainHash: string;
    transactionId: string;
    status: 'valid' | 'invalid' | 'pending';
}

export interface AuditLogEntry {
    _id?: string;
    id?: string; // Optional for backend response compatibility
    transactionId: string;
    deedNumber: string;
    action: 'register' | 'transfer' | 'update' | 'verify' | 'login';
    performedBy: string;
    timestamp: string;
    details?: string;
}

export interface DashboardStats {
    totalDeeds: number;
    pendingTransfers: number;
    todayVerifications: number;
    activeUsers: number;
}
