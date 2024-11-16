// <copyright file="AddStudentWorkRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

using System.Diagnostics.CodeAnalysis;

/// <summary>
/// Class for adding student work request.
/// </summary>
[SuppressMessage(
    "StyleCop.CSharp.NamingRules",
    "SA1313:Parameter names should begin with lower-case letter",
    Justification = "Causes another problem with names")]
public record AddStudentWorksRequest(
    string StudentName,
    string Theme,
    string Supervisor,
    string? Consultant,
    string Reviewer,
    int SupervisorMark,
    int ReviewerMark,
    string? CodeLink);