// <copyright file="CreateMeetingRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Class for meeting creation request.
/// </summary>
public class CreateMeetingRequest
{
    /// <summary>
    /// Gets or sets date and time.
    /// </summary>
    public DateTime DateAndTime { get; set; }

    /// <summary>
    /// Gets or sets auditorium.
    /// </summary>
    public string Auditorium { get; set; }

    /// <summary>
    /// Gets or sets info.
    /// </summary>
    public string Info { get; set; }

    /// <summary>
    /// Gets or sets call link.
    /// </summary>
    public string CallLink { get; set; }

    /// <summary>
    /// Gets or sets materials link.
    /// </summary>
    public string MaterialsLink { get; set; }

    /// <summary>
    /// Gets or sets student works.
    /// </summary>
    public List<AddStudentWorksRequest> StudentWorks { get; set; }

    /// <summary>
    /// Gets or sets members.
    /// </summary>
    public List<string> Members { get; set; }
}

/// <summary>
/// Class for adding student work request.
/// </summary>
public class AddStudentWorksRequest
{
    /// <summary>
    /// Gets or student's name.
    /// </summary>
    public string StudentName { get; set; }

    /// <summary>
    /// Gets or sets theme.
    /// </summary>
    public string Theme { get; set; }

    /// <summary>
    /// Gets or sets supervisor.
    /// </summary>
    public string Supervisor { get; set; }

    /// <summary>
    /// Gets or sets consultant.
    /// </summary>
    public string Consultant { get; set; }

    /// <summary>
    /// Gets or sets reviewer.
    /// </summary>
    public string Reviewer { get; set; }

    /// <summary>
    /// Gets or sets supervisor's mark.
    /// </summary>
    public int SupervisorMark { get; set; }

    /// <summary>
    /// Gets or sets reviewer's mark.
    /// </summary>
    public int ReviewerMark { get; set; }

    /// <summary>
    /// Gets or sets code link.
    /// </summary>
    public string CodeLink { get; set; }
}