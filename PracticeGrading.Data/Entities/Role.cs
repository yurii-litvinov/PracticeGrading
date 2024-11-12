// <copyright file="Role.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Role entity.
/// </summary>
public class Role
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets role name.
    /// </summary>
    public string RoleName { get; set; }

    /// <summary>
    /// Gets or sets users.
    /// </summary>
    public ICollection<User> Users { get; set; }
}