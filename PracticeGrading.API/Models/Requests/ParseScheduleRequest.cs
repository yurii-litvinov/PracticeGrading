// <copyright file="ParseScheduleRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for schedule parsing request.
/// </summary>
public record ParseScheduleRequest(
    string File,
    List<string> Headers,
    List<List<string>> Separator,
    int MembersColumn);