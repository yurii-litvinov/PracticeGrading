// <copyright file="CriteriaRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for criteria creation or updating request.
/// </summary>
public record CriteriaRequest(
    int? Id,
    string Name,
    string? Comment,
    List<RuleRequest> Scale,
    List<RuleRequest> Rules);