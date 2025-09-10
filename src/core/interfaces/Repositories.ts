import { Agent } from '../entities/Agent';
import { Collection } from '../entities/Collection';
import { Assignment } from '../entities/Assignment';
import { LocationPing } from '../entities/LocationPing';
import { Notification } from '../entities/Notification';
import { TripHistory } from '../entities/History';

export interface AgentRepository {
    createAgent(name: string, email: string, password: string): Promise<Agent>;
    getAgents(): Promise<Agent[]>;
    getAgentById(id: number): Promise<Agent | null>;
    updateAgent(id: number, data: Partial<Agent>): Promise<Agent | null>;
    deleteAgent(id: number): Promise<number>;
    verifyLogin(email: string, password: string): Promise<Agent | null>;
    getActiveCount(): Promise<number>;
    findAll(params?: { activeOnly?: boolean }): Promise<Agent[]>;
    findById(id: number): Promise<Agent | null>;
    updateStatus(id: number, status: string): Promise<void>;
    updateLastSeen(id: number, at: Date): Promise<void>;
}

export interface CollectionRepository {
    getSummaryCounts(): Promise<{ total: number; pending: number; completed: number }>;
    findPending(): Promise<Collection[]>;
    findById(id: string | number): Promise<Collection | null>;

    // assign agent
    assign(collectionId: string | number, agentId: string | number): Promise<{
        assignment: Assignment;
        collection: Collection | null;
    }>;

    // generic update
    update(collectionId: string | number, data: Partial<Collection>): Promise<Collection | null>;

    // status helpers
    updateStatus(
        collectionId: string | number,
        status: string,
        extra?: any
    ): Promise<Collection | null>;

    markCollected(
        collectionId: string | number,
        collectedAmount?: number,
        notes?: string,
        proofUrl?: string
    ): Promise<Collection | null>;

    markDelivered(
        collectionId: string | number,
        notes?: string,
        proofUrl?: string
    ): Promise<Collection | null>;
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
