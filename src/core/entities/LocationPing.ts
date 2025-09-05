export interface LocationPing {
    id: string;
    agentId: string;
    lat: number;
    lng: number;
    recordedAt: Date;
    batteryLevel?: number | null;
    stop?: boolean; // mark stop point
}