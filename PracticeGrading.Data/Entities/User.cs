// <copyright file="User.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// User entity.
/// </summary>
public class User
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets username.
    /// </summary>
    public required string UserName { get; set; }

    /// <summary>
    /// Gets or sets hashed password.
    /// </summary>
    public string? PasswordHash { get; set; }

    /// <summary>
    /// Gets or sets role id.
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Gets or sets role.
    /// </summary>
    public Role? Role { get; set; }

    /// <summary>
    /// Gets or sets meetings.
    /// </summary>
    public ICollection<Meeting>? Meetings { get; set; }

    /// <summary>
    /// Gets or sets the email address of the user.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Gets or sets the phone number of the user.
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Gets or sets the additional information about the user in Russian.
    /// This field may contain biographical data, professional background, or other relevant details.
    /// </summary>
    public string? InformationRu { get; set; }

    /// <summary>
    /// Gets or sets the additional information about the user in English.
    /// This field may contain biographical data, professional background, or other relevant details.
    /// </summary>
    public string? InformationEn { get; set; }

    /// <summary>
    /// Gets or sets marks.
    /// </summary>
    public ICollection<MemberMark>? Marks { get; set; }
}