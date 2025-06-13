// <copyright file="CriteriaDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Criteria DTO.
/// </summary>
public record CriteriaDto(int Id, string Name, string? Comment, List<RuleDto>? Scale, List<RuleDto>? Rules, List<int> CriteriaGroupsId);