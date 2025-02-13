// <copyright file="MemberMarkRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for member mark creation or updating request.
/// </summary>
public record MemberMarkRequest(
    int? Id,
    int MemberId,
    int StudentWorkId,
    List<CriteriaMarkRequest> CriteriaMarks,
    int Mark,
    string Comment);