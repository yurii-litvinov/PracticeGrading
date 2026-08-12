// <copyright file="MeetingMemberAccess.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Represents a personal commission member access
/// to a specific meeting.
/// </summary>
public class MeetingMemberAccess
{
    /// <summary>
    /// Gets or sets the access identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the meeting identifier.
    /// </summary>
    public int MeetingId { get; set; }

    /// <summary>
    /// Gets or sets the meeting.
    /// </summary>
    public Meeting? Meeting { get; set; }

    /// <summary>
    /// Gets or sets the commission member identifier.
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Gets or sets the commission member.
    /// </summary>
    public User? Member { get; set; }

    /// <summary>
    /// Gets or sets the SHA-256 hash of the personal
    /// meeting access token.
    /// </summary>
    public required string TokenHash { get; set; }

    /// <summary>
    /// Gets or sets the current access status.
    /// </summary>
    public MeetingMemberAccessStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the access creation date and time.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the status
    /// was last changed.
    /// </summary>
    public DateTime? StatusChangedAt { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the user who
    /// last changed the status.
    /// </summary>
    public int? StatusChangedByUserId { get; set; }

    /// <summary>
    /// Gets or sets the user who last changed the status.
    /// </summary>
    public User? StatusChangedByUser { get; set; }
}