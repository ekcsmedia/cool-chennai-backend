import { Agent } from '../entities/Agent';
import { Collection } from '../entities/Collection';
import { Assignment } from '../entities/Assignment';
import { LocationPing } from '../entities/LocationPing';
import { Notification } from '../entities/Notification';
import { TripHistory } from '../entities/History';

export interface AgentRepository {
    getActiveCount(): Promise<number>;
    findAll(params?: { activeOnly?: boolean }): Promise<Agent[]>;
    findById(id: string): Promise<Agent | null>;
    updateStatus(id: string, status: Agent['status']): Promise<void>;
    updateLastSeen(id: string, at: Date): Promise<void>;
}

export interface CollectionRepository {
    getSummaryCounts(): Promise<{ total: number; pending: number; completed: number }>;
    findPending(): Promise<Collection[]>;
    findById(id: string): Promise<Collection | null>;
    assign(collectionId: string, agentId: string): Promise<Assignment>;
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
