export type AgentStatus = 'on_duty' | 'idle' | 'off_duty';

export interface Agent {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    status: AgentStatus;
    lastSeenAt?: Date | null;
    password: string; // hashed
    createdAt?: Date;
    updatedAt?: Date;
}