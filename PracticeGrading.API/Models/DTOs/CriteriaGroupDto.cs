// <copyright file="CriteriaGroupDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Criteria group DTO.
/// </summary>
public record CriteriaGroupDto(
    int Id,
    string Name,
    int MetricType,
    List<CriteriaDto> Criteria,
    List<MarkScaleDto> MarkScales);