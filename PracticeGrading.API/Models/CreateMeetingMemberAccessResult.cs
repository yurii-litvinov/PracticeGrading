// <copyright file="CreateMeetingMemberAccessResult.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Represents the result of creating a meeting access request.
/// </summary>
public enum CreateMeetingMemberAccessResult
{
    /// <summary>
    /// The access request was created successfully.
    /// </summary>
    Success,

    /// <summary>
    /// The specified meeting was not found.
    /// </summary>
    MeetingNotFound,

    /// <summary>
    /// The specified member was not found.
    /// </summary>
    MemberNotFound,

    /// <summary>
    /// The specified user is not a commission member.
    /// </summary>
    InvalidMember,

    /// <summary>
    /// Neither an existing member nor a valid new member name was specified.
    /// </summary>
    InvalidMemberName,
}