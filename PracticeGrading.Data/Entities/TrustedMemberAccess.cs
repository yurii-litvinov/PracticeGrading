// <copyright file="TrustedMemberAccess.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Represents permanent trusted access issued to a commission member.
/// </summary>
public class TrustedMemberAccess
{
    /// <summary>
    /// Gets or sets the trusted access identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the commission member.
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Gets or sets the commission member associated with this access.
    /// </summary>
    public User? Member { get; set; }

    /// <summary>
    /// Gets or sets the hexadecimal hash of the secret access token.
    /// </summary>
    public required string TokenHash { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the access was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the access was revoked.
    /// A null value means that the access has not been revoked.
    /// </summary>
    public DateTime? RevokedAt { get; set; }
}