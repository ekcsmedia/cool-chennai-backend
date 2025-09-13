import { Agent } from '../entities/Agent';
import { LocationPing } from '../entities/LocationPing';
import { Notification } from '../entities/Notification';
import { TripHistory } from '../entities/History';

export interface AgentRepository {
    createAgent(name: string, email: string, password: string, phone?: string): Promise<Agent>;
    getAgents(): Promise<Agent[]>;
    getAgentById(id: string): Promise<Agent | null>;   // changed to string
    updateAgent(id: string, data: Partial<Agent>): Promise<Agent | null>;  // string
    deleteAgent(id: string): Promise<number>;  // string
    verifyLogin(email: string, password: string): Promise<Agent | null>;
    getActiveCount(): Promise<number>;
    findAll(params?: { activeOnly?: boolean }): Promise<Agent[]>;
    findById(id: string): Promise<Agent | null>;   // string
    updateStatus(id: string, status: string): Promise<void>;   // string
    updateLastSeen(id: string, at: Date): Promise<void>;   // string
}


// src/core/interfaces/Repositories/CollectionRepository.ts
export type CollectionType = 'pickup' | 'delivery' | 'service';
export type CollectionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'collected';

export interface Collection {
    id: string;
    code?: string;
    callId?: string; // optional alias
    title: string;
    address: string;
    amount: number;
    type: CollectionType;
    area?: string | null;
    city?: string | null;
    status: CollectionStatus;
    customerId?: string | null;
    assignedAgentId?: string | null;
    assignedAgentName?: string | null; // useful for UI
    dueAt?: string | null; // ISO string
    collectedAmount?: number | null;
    collectedAt?: string | null;
    deliveredAt?: string | null;
    notes?: string | null;
    proofUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

export interface Assignment {
    id: string;
    collectionId: string;
    agentId: string;
    assignedAt: string; // ISO
    reassignedFromId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

/**
 * CollectionRepository: the data layer contract for collections
 */
export interface CollectionRepository {
    // summary counts
    getSummaryCounts(): Promise<{ total: number; pending: number; completed: number }>;

    // basic lists
    findPending(): Promise<Collection[]>;
    findAll(opts?: { filters?: Partial<Pick<Collection, 'status' | 'assignedAgentId' | 'customerId'>>; page?: number; limit?: number; }): Promise<PaginatedResult<Collection>>;

    // by id
    findById(id: string): Promise<Collection | null>;

    // create / update / delete
    create(payload: {
        code?: string;
        title: string;
        address: string;
        amount: number;
        type?: CollectionType;
        area?: string | null;
        city?: string | null;
        customerId?: string | null;
        assignedAgentId?: string | null;
        dueAt?: Date | string | null;
    }): Promise<Collection>;

    update(collectionId: string, data: Partial<Collection & { dueAt?: Date | string | null }>): Promise<Collection | null>;
    delete(collectionId: string): Promise<number>; // returns number of rows deleted

    // assign agent (atomic) — returns created assignment + updated collection
    assign(collectionId: string, agentId: string): Promise<{ assignment: Assignment; collection: Collection | null }>;

    // status helpers
    updateStatus(collectionId: string, status: CollectionStatus | string, extra?: any): Promise<Collection | null>;
    markCollected(collectionId: string, collectedAmount?: number, notes?: string, proofUrl?: string): Promise<Collection | null>;
    markDelivered(collectionId: string, notes?: string, proofUrl?: string): Promise<Collection | null>;
}

export interface TrackingRepository {
    pushPing(ping: Omit<LocationPing, 'id'>): Promise<LocationPing>;
    getLatestByAgents(agentIds: string[]): Promise<Record<string, LocationPing | null>>;
    getStopsCount(agentId: string, date: Date): Promise<number>;
}

export interface NotificationRepository {
    list(role: 'admin' | 'agent'): Promise<Notification[]>;
    updateStatus(id: string, status: Notification['status']): Promise<void>;
}

export interface HistoryRepository {
    listByAgent(agentId: string, date?: string): Promise<TripHistory[]>;
    listByCustomer(customerId: string): Promise<TripHistory[]>;
}
