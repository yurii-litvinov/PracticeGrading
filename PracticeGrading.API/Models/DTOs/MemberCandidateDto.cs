// <copyright file="MemberCandidateDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Identifies a member available for an access request without exposing profile details.
/// </summary>
/// <param name="Id">Member identifier.</param>
/// <param name="Name">Member name.</param>
public record MemberCandidateDto(int Id, string Name);
