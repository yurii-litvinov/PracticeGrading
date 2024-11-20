// <copyright file="CriteriaConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of criteria entity.
/// </summary>
public class CriteriaConfiguration : IEntityTypeConfiguration<Criteria>
{
    /// <summary>
    /// Configures criteria entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<Criteria> builder)
    {
        builder.HasKey(criteria => criteria.Id);

        builder.HasMany<Rule>(criteria => criteria.Rules)
            .WithOne(rule => rule.Criteria)
            .HasForeignKey(rule => rule.CriteriaId);
    }
}