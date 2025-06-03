// <copyright file="Meeting.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Meeting entity.
/// </summary>
public class Meeting
{
    /// <summary>
    /// Gets or sets id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets date and time.
    /// </summary>
    public DateTime DateAndTime { get; set; }

    /// <summary>
    /// Gets or sets auditorium.
    /// </summary>
    public string? Auditorium { get; set; }

    /// <summary>
    /// Gets or sets info.
    /// </summary>
    public string? Info { get; set; }

    /// <summary>
    /// Gets or sets call link.
    /// </summary>
    public string? CallLink { get; set; }

    /// <summary>
    /// Gets or sets materials link.
    /// </summary>
    public string? MaterialsLink { get; set; }

    /// <summary>
    /// Gets or sets student works.
    /// </summary>
    public required ICollection<StudentWork> StudentWorks { get; set; }

    /// <summary>
    /// Gets or sets members.
    /// </summary>
    public ICollection<User>? Members { get; set; }

    /// <summary>
    /// Gets or sets criteria group.
    /// </summary>
    public required CriteriaGroup CriteriaGroup { get; set; }
}