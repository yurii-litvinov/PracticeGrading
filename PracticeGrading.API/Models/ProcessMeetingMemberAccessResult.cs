// <copyright file="ProcessMeetingMemberAccessResult.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Represents the result of processing a meeting access request.
/// </summary>
public enum ProcessMeetingMemberAccessResult
{
    /// <summary>
    /// The request was processed successfully.
    /// </summary>
    Success,

    /// <summary>
    /// The request was not found for the specified meeting.
    /// </summary>
    AccessNotFound,

    /// <summary>
    /// The request has already been processed.
    /// </summary>
    AlreadyProcessed,
}