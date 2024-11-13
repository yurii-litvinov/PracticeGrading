// <copyright file="CreateMeetingRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

using System.Diagnostics.CodeAnalysis;

/// <param name="DateAndTime">Gets or sets date and time.</param>
/// <param name="Auditorium">Gets or sets auditorium.</param>
/// <param name="Info">Gets or sets info.</param>
/// <param name="CallLink">Gets or sets call link.</param>
/// <param name="MaterialsLink">Gets or sets materials link.</param>
/// <param name="StudentWorks">Gets or sets student works.</param>
/// <param name="Members">Gets or sets members.</param>
[SuppressMessage(
    "StyleCop.CSharp.NamingRules",
    "SA1313:Parameter names should begin with lower-case letter",
    Justification = "Causes another problem with names")]
public record CreateMeetingRequest(
    DateTime DateAndTime,
    string Auditorium,
    string Info,
    string CallLink,
    string MaterialsLink,
    List<AddStudentWorksRequest> StudentWorks,
    List<string> Members);