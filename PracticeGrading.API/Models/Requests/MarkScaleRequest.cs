// <copyright file="MarkScaleRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Class for adding mark scale request.
/// </summary>
public record MarkScaleRequest(int? Id, double Min, double Max, string Mark);