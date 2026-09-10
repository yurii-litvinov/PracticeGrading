/**
 * Meeting member access request status.
 */
export enum MeetingMemberAccessStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Revoked = 3,
}

/**
 * Meeting member access request status information.
 */
export interface MeetingMemberAccessStatusInfo {
    meetingId: number;
    memberId: number;
    memberName: string;
    status: MeetingMemberAccessStatus;
    createdAt: string;
    statusChangedAt: string | null;
}

/**
 * Pending meeting member access request.
 */
export interface PendingMeetingMemberAccess {
    id: number;
    memberId: number;
    memberName: string;
    createdAt: string;
}

export interface ApprovedMeetingMemberAccess {
    id: number;
    memberId: number;
    memberName: string;
    createdAt: string;
    approvedAt: string | null;
}