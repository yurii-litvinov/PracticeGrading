// <copyright file="CriteriaGroupConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of criteria group entity.
/// </summary>
public class CriteriaGroupConfiguration : IEntityTypeConfiguration<CriteriaGroup>
{
    /// <summary>
    /// Configures criteria group entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<CriteriaGroup> builder)
    {
        builder.HasKey(group => group.Id);

        builder.HasMany<Criteria>(group => group.Criteria)
            .WithMany(criteria => criteria.CriteriaGroups);

        builder.HasMany<MarkScale>(group => group.MarkScales)
            .WithOne(scale => scale.CriteriaGroup)
            .HasForeignKey(scale => scale.CriteriaGroupId);

        builder.HasData(
            new CriteriaGroup
            {
                Id = 1,
                Name = "Критерии для учебных практик",
                MetricType = 1,
            });
    }
}