// <copyright file="SelectedRule.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Entities;

/// <summary>
/// Selected rule entity.
/// </summary>
public class SelectedRule
{
    /// <summary>
    /// Gets or sets rule id.
    /// </summary>
    public int RuleId { get; set; }

    /// <summary>
    /// Gets or sets criteria mark id.
    /// </summary>
    public int CriteriaMarkId { get; set; }

    /// <summary>
    /// Gets or sets criteria mark.
    /// </summary>
    public CriteriaMark? CriteriaMark { get; set; }

    /// <summary>
    /// Gets or sets selected value.
    /// </summary>
    public int Value { get; set; }
}