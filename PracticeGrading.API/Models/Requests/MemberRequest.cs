// <copyright file="MemberRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for member request.
/// </summary>
public record MemberRequest(
    int? Id,
    string Name);