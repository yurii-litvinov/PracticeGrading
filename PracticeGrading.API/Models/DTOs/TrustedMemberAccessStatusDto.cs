// <copyright file="TrustedMemberAccessStatusDto.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Represents the current state of trusted access for a commission member.
/// </summary>
/// <param name="IsIssued">
/// Indicates whether trusted access has ever been issued.
/// </param>
/// <param name="IsActive">
/// Indicates whether trusted access is currently active.
/// </param>
/// <param name="CreatedAt">
/// The date and time when the current access token was issued.
/// </param>
/// <param name="RevokedAt">
/// The date and time when access was revoked, if applicable.
/// </param>
public record TrustedMemberAccessStatusDto(
    bool IsIssued,
    bool IsActive,
    DateTime? CreatedAt,
    DateTime? RevokedAt);