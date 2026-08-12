/**
 * Describes the current trusted access state of a commission member.
 */
export interface TrustedMemberAccessStatus {
    isIssued: boolean;
    isActive: boolean;
    createdAt: string | null;
    revokedAt: string | null;
}