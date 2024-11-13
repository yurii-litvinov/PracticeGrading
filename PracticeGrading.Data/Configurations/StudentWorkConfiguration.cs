// <copyright file="StudentWorkConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Entities;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// The class for configuration of student work entity.
/// </summary>
public class StudentWorkConfiguration : IEntityTypeConfiguration<StudentWork>
{
    /// <summary>
    /// Configures student work entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<StudentWork> builder)
    {
        builder.HasKey(work => work.Id);

        builder.HasMany<MemberMark>(work => work.MemberMarks)
            .WithOne(mark => mark.StudentWork)
            .HasForeignKey(mark => mark.StudentWorkId);
    }
}