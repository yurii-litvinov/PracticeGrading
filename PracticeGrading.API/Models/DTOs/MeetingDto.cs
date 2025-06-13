// <copyright file="MeetingDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Meeting DTO.
/// </summary>
public record MeetingDto(
    int? Id,
    DateTime DateAndTime,
    string? Auditorium,
    string? Info,
    string? CallLink,
    string? MaterialsLink,
    List<StudentWorkDto> StudentWorks,
    List<MemberDto> Members,
    CriteriaGroupDto CriteriaGroup);