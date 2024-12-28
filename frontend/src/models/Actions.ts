/**
 * Enum for actions.
 *
 * Update - admin updates meeting.
 * Voting - admin starts voting.
 * Highlight - admin highlights student.
 * Join - member joined meeting.
 * SendMark - member sent mark.
 */
export enum Actions {
    Update = "update",
    Voting = "voting",
    Highlight = "highlight",
    Join = "join",
    SendMark = "sendmark"
}