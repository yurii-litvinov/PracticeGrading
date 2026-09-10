// <copyright file="CreateMeetingMemberAccessRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Represents a request to join a meeting as a commission member.
/// </summary>
/// <param name="MemberId">Commission member identifier.</param>
public record CreateMeetingMemberAccessRequest(
    int MemberId,
    string? UserName);