// <copyright file="Criteria.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Criteria entity.
/// </summary>
public class Criteria
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets name.
    /// </summary>
    public int Name { get; set; }

    /// <summary>
    /// Gets or sets comment.
    /// </summary>
    public int Comment { get; set; }

    /// <summary>
    /// Gets or sets scale.
    /// </summary>
    public List<int> Scale { get; set; }

    /// <summary>
    /// Gets or sets rules.
    /// </summary>
    public ICollection<Rule> Rules { get; set; }
}