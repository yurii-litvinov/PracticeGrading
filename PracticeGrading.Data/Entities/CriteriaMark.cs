// <copyright file="CriteriaMark.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// CriteriaMark entity.
/// </summary>
public class CriteriaMark
{
    /// <summary>
    /// Gets or sets criteria mark id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets criteria id.
    /// </summary>
    public int CriteriaId { get; set; }

    /// <summary>
    /// Gets or sets criteria.
    /// </summary>
    public Criteria? Criteria { get; set; }

    /// <summary>
    /// Gets or sets member mark id.
    /// </summary>
    public int MemberMarkId { get; set; }

    /// <summary>
    /// Gets or sets member mark.
    /// </summary>
    public MemberMark? MemberMark { get; set; }

    /// <summary>
    /// Gets or sets member comment.
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Gets or sets selected rules.
    /// </summary>
    public required ICollection<Rule> SelectedRules { get; set; }

    /// <summary>
    /// Gets or sets mark.
    /// </summary>
    public int Mark { get; set; }
}