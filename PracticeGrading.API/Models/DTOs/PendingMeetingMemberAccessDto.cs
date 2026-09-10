// <copyright file="PendingMeetingMemberAccessDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Contains information about a pending meeting access request.
/// </summary>
/// <param name="Id">Access request identifier.</param>
/// <param name="MemberId">Commission member identifier.</param>
/// <param name="MemberName">Commission member name.</param>
/// <param name="CreatedAt">Request creation time.</param>
public record PendingMeetingMemberAccessDto(
    int Id,
    int MemberId,
    string MemberName,
    DateTime CreatedAt);