// <copyright file="StudentWorkRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for student work request.
/// </summary>
public record StudentWorkRequest(
    int? Id,
    string StudentName,
    string? Info,
    string Theme,
    string Supervisor,
    string? SupervisorInfo,
    string? Consultant,
    string? Reviewer,
    string? ReviewerInfo,
    string? SupervisorMark,
    string? ReviewerMark,
    string? CodeLink,
    string? ReportLink,
    string? SupervisorReviewLink,
    string? ConsultantReviewLink,
    string? ReviewerReviewLink,
    string? AdditionalLink);