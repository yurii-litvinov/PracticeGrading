// <copyright file="RuleConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Entities;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// The class for configuration of rule entity.
/// </summary>
public class RuleConfiguration : IEntityTypeConfiguration<Rule>
{
    /// <summary>
    /// Configures rule entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<Rule> builder)
    {
        builder.HasKey(rule => rule.Id);
    }
}