// <copyright file="MarkScaleDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Mark scale DTO.
/// </summary>
public record MarkScaleDto(int Id, double Min, double Max, string Mark);