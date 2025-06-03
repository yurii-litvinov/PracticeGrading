// <copyright file="MarkScale.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Criteria entity.
/// </summary>
public class MarkScale
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets minimum.
    /// </summary>
    public required double Min { get; set; }

    /// <summary>
    /// Gets or sets maximum.
    /// </summary>
    public required double Max { get; set; }

    /// <summary>
    /// Gets or sets mark.
    /// </summary>
    public required string Mark { get; set; }

    /// <summary>
    /// Gets or sets criteria group id.
    /// </summary>
    public int CriteriaGroupId { get; set; }

    /// <summary>
    /// Gets or sets criteria group.
    /// </summary>
    public CriteriaGroup? CriteriaGroup { get; set; }
}