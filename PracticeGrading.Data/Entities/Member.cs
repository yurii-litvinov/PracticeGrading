// <copyright file="Member.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Member entity.
/// </summary>
public class Member : User
{
    /// <summary>
    /// Gets or sets meeting id.
    /// </summary>
    public int MeetingId { get; set; }

    /// <summary>
    /// Gets or sets meeting.
    /// </summary>
    public Meeting Meeting { get; set; }

    /// <summary>
    /// Gets or sets marks.
    /// </summary>
    public ICollection<MemberMark> Marks { get; set; }
}