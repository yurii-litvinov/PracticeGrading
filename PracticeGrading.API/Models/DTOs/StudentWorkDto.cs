// <copyright file="StudentWorkDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Student work DTO.
/// </summary>
public record StudentWorkDto(
    int? Id,
    string StudentName,
    string? Info,
    string Theme,
    string Supervisor,
    string? Consultant,
    string? Reviewer,
    string? SupervisorMark,
    string? ReviewerMark,
    string? CodeLink,
    List<AverageCriteriaMarkDto> AverageCriteriaMarks,
    string? FinalMark);