// <copyright file="MeetingMemberAccessStatusDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

using PracticeGrading.Data.Entities;

/// <summary>
/// Contains information about a meeting access request.
/// </summary>
/// <param name="MeetingId">Meeting identifier.</param>
/// <param name="MemberId">Commission member identifier.</param>
/// <param name="MemberName">Commission member name.</param>
/// <param name="Status">Current access request status.</param>
/// <param name="CreatedAt">Request creation time.</param>
/// <param name="StatusChangedAt">
/// Time when the request status was last changed.
/// </param>
public record MeetingMemberAccessStatusDto(
    int MeetingId,
    int MemberId,
    string MemberName,
    MeetingMemberAccessStatus Status,
    DateTime CreatedAt,
    DateTime? StatusChangedAt);