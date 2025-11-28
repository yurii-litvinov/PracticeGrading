// <copyright file="MeetingRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

using PracticeGrading.API.Models.DTOs;

/// <summary>
/// Class for meeting creation or updating request.
/// </summary>
public record MeetingRequest(
    int? Id,
    DateTime DateAndTime,
    string? Auditorium,
    string? Info,
    string? CallLink,
    string? MaterialsLink,
    List<StudentWorkRequest> StudentWorks,
    List<int> MemberIds,
    int CriteriaGroupId);