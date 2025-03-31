// <copyright file="SelectedRuleConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of selected rule entity.
/// </summary>
public class SelectedRuleConfiguration : IEntityTypeConfiguration<SelectedRule>
{
    /// <summary>
    /// Configures selected rule entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<SelectedRule> builder)
    {
        builder.HasKey(rule => new { rule.RuleId, rule.CriteriaMarkId });
    }
}
