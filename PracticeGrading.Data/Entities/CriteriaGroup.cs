// <copyright file="CriteriaGroup.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Criteria entity.
/// </summary>
public class CriteriaGroup
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
    /// Gets or sets metric type.
    /// </summary>
    public int MetricType { get; set; }

    /// <summary>
    /// Gets or sets criteria.
    /// </summary>
    public ICollection<Criteria> Criteria { get; set; } = new List<Criteria>();

    /// <summary>
    /// Gets or sets mark scales.
    /// </summary>
    public ICollection<MarkScale>? MarkScales { get; set; }

    /// <summary>
    /// Gets or sets meetings.
    /// </summary>
    public ICollection<Meeting>? Meetings { get; set; }
}