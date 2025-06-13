// <copyright file="MarkScaleConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of mark scale entity.
/// </summary>
public class MarkScaleConfiguration : IEntityTypeConfiguration<MarkScale>
{
    /// <summary>
    /// Configures mark scale entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<MarkScale> builder)
    {
        builder.HasKey(scale => scale.Id);

        builder.HasData(
            new MarkScale
            {
                Id = 1,
                Min = 4.6,
                Max = 5,
                Mark = "A",
                CriteriaGroupId = 1,
            },
            new MarkScale
            {
                Id = 2,
                Min = 4.1,
                Max = 4.5,
                Mark = "B",
                CriteriaGroupId = 1,
            },
            new MarkScale
            {
                Id = 3,
                Min = 3.6,
                Max = 4,
                Mark = "C",
                CriteriaGroupId = 1,
            },
            new MarkScale
            {
                Id = 4,
                Min = 3.1,
                Max = 3.5,
                Mark = "D",
                CriteriaGroupId = 1,
            },
            new MarkScale
            {
                Id = 5,
                Min = 2.6,
                Max = 3,
                Mark = "E",
                CriteriaGroupId = 1,
            },
            new MarkScale
            {
                Id = 6,
                Min = 0,
                Max = 2.5,
                Mark = "F",
                CriteriaGroupId = 1,
            });
    }
}