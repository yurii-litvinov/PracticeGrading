// <copyright file="MemberMark.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Member mark entity.
/// </summary>
public class MemberMark
{
    /// <summary>
    /// Gets or sets member mark id.
    /// </summary>
    public int Id { get; set; }

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
    /// Gets or sets criteria marks.
    /// </summary>
    public required ICollection<CriteriaMark> CriteriaMarks { get; set; }

    /// <summary>
    /// Gets or sets mark.
    /// </summary>
    public int Mark { get; set; }
}