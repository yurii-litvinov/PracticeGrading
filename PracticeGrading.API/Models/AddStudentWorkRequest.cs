// <copyright file="AddStudentWorkRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

using System.Diagnostics.CodeAnalysis;

/// <param name="StudentName">Gets or student's name.</param>
/// <param name="Theme">Gets or sets theme.</param>
/// <param name="Supervisor">Gets or sets supervisor.</param>
/// <param name="Consultant">Gets or sets consultant.</param>
/// <param name="Reviewer">Gets or sets reviewer.</param>
/// <param name="SupervisorMark">Gets or sets supervisor's mark.</param>
/// <param name="ReviewerMark">Gets or sets reviewer's mark.</param>
/// <param name="CodeLink">Gets or sets code link.</param>
[SuppressMessage(
    "StyleCop.CSharp.NamingRules",
    "SA1313:Parameter names should begin with lower-case letter",
    Justification = "Causes another problem with names")]
public record AddStudentWorksRequest(
    string StudentName,
    string Theme,
    string Supervisor,
    string Consultant,
    string Reviewer,
    int SupervisorMark,
    int ReviewerMark,
    string CodeLink);