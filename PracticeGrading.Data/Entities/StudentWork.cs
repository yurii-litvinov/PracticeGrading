// <copyright file="StudentWork.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Student work entity.
/// </summary>
public class StudentWork
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets or student's name.
    /// </summary>
    public required string StudentName { get; set; }

    /// <summary>
    /// Gets or sets info.
    /// </summary>
    public string? Info { get; set; }

    /// <summary>
    /// Gets or sets theme.
    /// </summary>
    public required string Theme { get; set; }

    /// <summary>
    /// Gets or sets supervisor.
    /// </summary>
    public required string Supervisor { get; set; }

    /// <summary>
    /// Gets or sets consultant.
    /// </summary>
    public string? Consultant { get; set; }

    /// <summary>
    /// Gets or sets reviewer.
    /// </summary>
    public string? Reviewer { get; set; }

    /// <summary>
    /// Gets or sets supervisor's mark.
    /// </summary>
    public int? SupervisorMark { get; set; }

    /// <summary>
    /// Gets or sets reviewer's mark.
    /// </summary>
    public int? ReviewerMark { get; set; }

    /// <summary>
    /// Gets or sets final mark.
    /// </summary>
    public int? FinalMark { get; set; }

    /// <summary>
    /// Gets or sets code link.
    /// </summary>
    public string? CodeLink { get; set; }

    /// <summary>
    /// Gets or sets meeting id.
    /// </summary>
    public int MeetingId { get; set; }

    /// <summary>
    /// Gets or sets meeting.
    /// </summary>
    public Meeting? Meeting { get; set; }

    /// <summary>
    /// Gets or sets members marks.
    /// </summary>
    public ICollection<MemberMark>? MemberMarks { get; set; }

    /// <summary>
    /// Gets or sets average criteria marks.
    /// </summary>
    public required ICollection<AverageCriteriaMark> AverageCriteriaMarks { get; set; }
}