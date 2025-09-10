export type CallStatus = 'connected' | 'no_answer' | 'missed' | 'failed' | 'busy';

export interface CallLog {
    id?: number;
    callId?: string; // UI #COL-1032 style
    customerId?: number | string;
    customerName: string;
    agentId?: number | string | null;
    agentName?: string | null;
    durationSeconds?: number | null;
    durationHuman?: string | null; // optional denormalized
    status: CallStatus;
    startedAt?: Date | null;
    endedAt?: Date | null;
    // location captured during call (optional)
    locationLat?: number | null;
    locationLng?: number | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
