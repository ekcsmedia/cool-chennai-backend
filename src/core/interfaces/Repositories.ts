// src/core/interfaces/Repositories/index.ts
import { Agent } from '../entities/Agent';
import { LocationPing } from '../entities/LocationPing';
import { Notification } from '../entities/Notification';
import { TripHistory } from '../entities/History';

export interface AgentRepository {
    createAgent(name: string, email: string, password: string, phone?: string): Promise<Agent>;
    getAgents(): Promise<Agent[]>;
    getAgentById(id: string): Promise<Agent | null>;
    updateAgent(id: string, data: Partial<Agent>): Promise<Agent | null>;
    deleteAgent(id: string): Promise<number>;
    verifyLogin(email: string, password: string): Promise<Agent | null>;
    getActiveCount(): Promise<number>;
    findAll(params?: { activeOnly?: boolean }): Promise<Agent[]>;
    findById(id: string): Promise<Agent | null>;
    updateStatus(id: string, status: string): Promise<void>;
    updateLastSeen(id: string, at: Date): Promise<void>;
}

/* --------------------- Collection repository types --------------------- */

export type CollectionType = 'pickup' | 'delivery' | 'service';
export type CollectionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'collected';

export interface Collection {
    id: string;
    code?: string;
    callId?: string;
    title: string;
    address: string;
    amount: number;
    type: CollectionType;
    area?: string | null;
    city?: string | null;
    status: CollectionStatus;
    customerId?: string | null;
    assignedAgentId?: string | null;
    assignedAgentName?: string | null;
    dueAt?: string | null; // ISO string
    collectedAmount?: number | null;
    collectedAt?: string | null;
    deliveredAt?: string | null;
    notes?: string | null;
    proofUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;

    // optional tracking fields (useful for quick reads)
    lastLat?: number | null;
    lastLng?: number | null;
    lastPingAt?: string | null;
    batteryLevel?: number | null;
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
 * CollectionRepository contract
 */
export interface CollectionRepository {
    // summary counts
    getSummaryCounts(): Promise<{ total: number; pending: number; completed: number }>;

    // basic lists
    findPending(opts?: { agentId?: string }): Promise<Collection[]>;
    findAll(opts?: {
        filters?: Partial<Pick<Collection, 'status' | 'assignedAgentId' | 'customerId'>>;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<Collection>>;

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

    // ----------------- Tracking-related (new) -----------------
    /**
     * Start tracking a collection by an agent.
     * Should be idempotent: starting again for same agent returns current state.
     */
    startTracking(collectionId: string, agentId: string): Promise<{ startedAt?: Date | null; collection: Collection | null }>;

    /**
     * Stop tracking a collection. Optionally include final location/battery.
     */
    stopTracking(
        collectionId: string,
        agentId: string,
        opts?: { lat?: number; lng?: number; batteryLevel?: number }
    ): Promise<{ stoppedAt?: Date | null; collection: Collection | null }>;

    /**
     * Persist a ping/heartbeat related to a collection.
     * raw can contain the full incoming payload.
     */
    savePing(
        collectionId: string,
        agentId: string,
        payload: { lat?: number; lng?: number; batteryLevel?: number; ts?: Date | string; raw?: any }
    ): Promise<CollectionPing>;
}

/* --------------------- Tracking / ping types & repo --------------------- */

export interface CollectionPing {
    id: string;
    collectionId: string;
    agentId?: string | null;
    lat?: number | null;
    lng?: number | null;
    batteryLevel?: number | null;
    ts: string; // ISO
    raw?: any;
    createdAt: Date;
    updatedAt?: Date;
}

export interface TrackingRepository {
    // Push a ping into the tracking store (independent of collections)
    pushPing(ping: Omit<LocationPing, 'id'>): Promise<LocationPing>;

    // Convenience: get latest ping for a list of agents
    getLatestByAgents(agentIds: string[]): Promise<Record<string, LocationPing | null>>;

    // Count stop events for an agent on a date (used for analytics)
    getStopsCount(agentId: string, date: Date): Promise<number>;
}

/* --------------------- Notifications & History --------------------- */

export interface NotificationRepository {
    list(role: "admin" | "agent"): Promise<Notification[]>;
    listUnread(role: "admin" | "agent"): Promise<Notification[]>; // now required
    updateStatus(id: string, status: Notification["status"]): Promise<void>;
    create(payload: {
        title: string;
        body: string;
        kind?: string;
        actorRole?: "admin" | "agent";
        meta?: any;
        dueAt?: Date | string | null;
    }): Promise<Notification>;
}

// History Repository
export interface HistoryRepository {
    listByAgent(agentId: string, date?: string, page?: number, limit?: number): Promise<TripHistory[]>;
    listByCustomer(customerId: string, from?: string, to?: string, page?: number, limit?: number): Promise<TripHistory[]>;
    listCollectionsHistory(opts: {
        from?: string;
        to?: string;
        agentId?: string;
        customerId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<Collection[]>;
    getByCollectionId(collectionId: string): Promise<Collection | null>;
}
