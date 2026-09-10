const MEETING_ACCESS_TOKEN_KEY_PREFIX =
    'meeting-member-access-token';

/**
 * Saves a meeting-specific access token.
 */
export const saveMeetingAccessToken = (
    meetingId: number,
    token: string,
) => {
    localStorage.setItem(
        `${MEETING_ACCESS_TOKEN_KEY_PREFIX}:${meetingId}`,
        token,
    );
};

/**
 * Returns a saved meeting-specific access token.
 */
export const getMeetingAccessToken = (
    meetingId: number,
) =>
    localStorage.getItem(
        `${MEETING_ACCESS_TOKEN_KEY_PREFIX}:${meetingId}`,
    );

/**
 * Removes a saved meeting-specific access token.
 */
export const removeMeetingAccessToken = (
    meetingId: number,
) => {
    localStorage.removeItem(
        `${MEETING_ACCESS_TOKEN_KEY_PREFIX}:${meetingId}`,
    );
};