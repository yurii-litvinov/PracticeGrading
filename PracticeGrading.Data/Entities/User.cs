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
    public string UserName { get; set; }

    /// <summary>
    /// Gets or sets hashed password.
    /// </summary>
    public string PasswordHash { get; set; }

    /// <summary>
    /// Gets or sets role id.
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Gets or sets role.
    /// </summary>
    public Role Role { get; set; }
}