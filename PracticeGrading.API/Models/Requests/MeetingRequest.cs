// <copyright file="MeetingRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

using DTOs;
using System.Diagnostics.CodeAnalysis;

/// <summary>
/// Class for meeting creation or updating request.
/// </summary>
[SuppressMessage(
    "StyleCop.CSharp.NamingRules",
    "SA1313:Parameter names should begin with lower-case letter",
    Justification = "Causes another problem with names")]
public record MeetingRequest(
    int? Id,
    DateTime DateAndTime,
    string Auditorium,
    string Info,
    string CallLink,
    string MaterialsLink,
    List<AddStudentWorksRequest> StudentWorks,
    List<string> Members,
    List<int> CriteriaId);