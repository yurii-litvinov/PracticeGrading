// <copyright file="ApprovedMeetingMemberAccessDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Represents an approved access to a meeting.
/// </summary>
/// <param name="Id">Access identifier.</param>
/// <param name="MemberId">Commission member identifier.</param>
/// <param name="MemberName">Commission member name.</param>
/// <param name="CreatedAt">Access request creation time.</param>
/// <param name="ApprovedAt">Access approval time.</param>
public record ApprovedMeetingMemberAccessDto(
    int Id,
    int MemberId,
    string MemberName,
    DateTime CreatedAt,
    DateTime? ApprovedAt);