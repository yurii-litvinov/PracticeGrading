// <copyright file="MemberMarkDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Member mark DTO.
/// </summary>
public record MemberMarkDto(
    int Id,
    int MemberId,
    int StudentWorkId,
    List<CriteriaMarkDto> CriteriaMarks,
    int Mark,
    string Comment);