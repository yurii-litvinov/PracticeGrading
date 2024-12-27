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
    /// Gets or sets member id.
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Gets or sets member.
    /// </summary>
    public User? Member { get; set; }

    /// <summary>
    /// Gets or sets student work id.
    /// </summary>
    public int StudentWorkId { get; set; }

    /// <summary>
    /// Gets or sets student work.
    /// </summary>
    public StudentWork? StudentWork { get; set; }

    /// <summary>
    /// Gets or sets criteria id.
    /// </summary>
    public int CriteriaId { get; set; }

    /// <summary>
    /// Gets or sets criteria.
    /// </summary>
    public Criteria? Criteria { get; set; }

    /// <summary>
    /// Gets or sets selected rules.
    /// </summary>
    public ICollection<Rule>? SelectedRules { get; set; }

    /// <summary>
    /// Gets or sets member mark.
    /// </summary>
    public MemberMark? MemberMark { get; set; }

    /// <summary>
    /// Gets or sets average criteria mark.
    /// </summary>
    public AverageCriteriaMark? AverageCriteriaMark { get; set; }

    /// <summary>
    /// Gets or sets mark.
    /// </summary>
    public int Mark { get; set; }
}