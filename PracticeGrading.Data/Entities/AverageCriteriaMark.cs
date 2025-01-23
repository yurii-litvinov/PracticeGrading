// <copyright file="AverageCriteriaMark.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Average criteria mark entity.
/// </summary>
public class AverageCriteriaMark
{
    /// <summary>
    /// Gets or sets criteria id.
    /// </summary>
    public int CriteriaId { get; set; }

    /// <summary>
    /// Gets or sets student work id.
    /// </summary>
    public int StudentWorkId { get; set; }

    /// <summary>
    /// Gets or sets student work.
    /// </summary>
    public StudentWork? StudentWork { get; set; }

    /// <summary>
    /// Gets or sets average mark.
    /// </summary>
    public double? AverageMark { get; set; }
}