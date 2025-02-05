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
    public required string Name { get; set; }

    /// <summary>
    /// Gets or sets comment.
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Gets or sets rules.
    /// </summary>
    public ICollection<Rule>? Rules { get; set; }

    /// <summary>
    /// Gets or sets meetings.
    /// </summary>
    public ICollection<Meeting>? Meetings { get; set; }
}