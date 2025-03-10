// <copyright file="CriteriaMarkConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of criteria mark entity.
/// </summary>
public class CriteriaMarkConfiguration : IEntityTypeConfiguration<CriteriaMark>
{
    /// <summary>
    /// Configures criteria mark entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<CriteriaMark> builder)
    {
        builder.HasKey(mark => mark.Id);

        builder.HasOne<MemberMark>(mark => mark.MemberMark)
            .WithMany(memberMark => memberMark.CriteriaMarks);

        builder.HasMany<Rule>(mark => mark.SelectedRules)
            .WithMany(rule => rule.CriteriaMarks);
    }
}