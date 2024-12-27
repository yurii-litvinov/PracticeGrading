// <copyright file="AverageCriteriaMarkConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of average criteria mark entity.
/// </summary>
public class AverageCriteriaMarkConfiguration : IEntityTypeConfiguration<AverageCriteriaMark>
{
    /// <summary>
    /// Configures average criteria mark entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<AverageCriteriaMark> builder)
    {
        builder.HasKey(mark => new { mark.StudentWorkId, mark.CriteriaId });

        builder.HasMany<CriteriaMark>(mark => mark.CriteriaMarks)
            .WithOne(criteriaMark => criteriaMark.AverageCriteriaMark)
            .HasForeignKey(criteriaMark => new { criteriaMark.StudentWorkId, criteriaMark.CriteriaId })
            .HasPrincipalKey(mark => new { mark.StudentWorkId, mark.CriteriaId });
    }
}