// <copyright file="Rule.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Rule entity.
/// </summary>
public class Rule
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets type.
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Gets or sets description.
    /// </summary>
    public required string Description { get; set; }

    /// <summary>
    /// Gets or sets value.
    /// </summary>
    public int Value { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether rule is an element of the scale.
    /// </summary>
    public bool IsScaleRule { get; set; }

    /// <summary>
    /// Gets or sets criteria id.
    /// </summary>
    public int CriteriaId { get; set; }

    /// <summary>
    /// Gets or sets criteria.
    /// </summary>
    public Criteria? Criteria { get; set; }
}