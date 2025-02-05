// <copyright file="MeetingConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of meeting entity.
/// </summary>
public class MeetingConfiguration : IEntityTypeConfiguration<Meeting>
{
    /// <summary>
    /// Configures meeting entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<Meeting> builder)
    {
        builder.HasKey(meeting => meeting.Id);

        builder.HasMany<StudentWork>(meeting => meeting.StudentWorks)
            .WithOne(work => work.Meeting)
            .HasForeignKey(work => work.MeetingId);

        builder.HasMany<Criteria>(meeting => meeting.Criteria)
            .WithMany(criteria => criteria.Meetings);
    }
}