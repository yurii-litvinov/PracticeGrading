// <copyright file="MeetingMemberAccessStatus.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Represents the state of a commission member's
/// access to a meeting.
/// </summary>
public enum MeetingMemberAccessStatus
{
    /// <summary>
    /// The access request is awaiting confirmation.
    /// </summary>
    Pending,

    /// <summary>
    /// The access request has been approved.
    /// </summary>
    Approved,

    /// <summary>
    /// The access request has been rejected.
    /// </summary>
    Rejected,

    /// <summary>
    /// The previously approved access has been revoked.
    /// </summary>
    Revoked,
}