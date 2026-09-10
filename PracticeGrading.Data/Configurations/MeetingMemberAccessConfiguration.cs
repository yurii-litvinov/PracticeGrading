// <copyright file="MeetingMemberAccessConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// Configures the meeting member access entity.
/// </summary>
public class MeetingMemberAccessConfiguration
    : IEntityTypeConfiguration<MeetingMemberAccess>
{
    /// <summary>
    /// Configures the meeting member access entity.
    /// </summary>
    /// <param name="builder">
    /// The entity type builder.
    /// </param>
    public void Configure(
        EntityTypeBuilder<MeetingMemberAccess> builder)
    {
        builder.HasKey(access => access.Id);

        builder.Property(access => access.TokenHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(access => access.Status)
            .HasConversion<int>()
            .HasDefaultValue(
                MeetingMemberAccessStatus.Pending)
            .IsConcurrencyToken();

        builder.HasIndex(access => access.TokenHash)
            .IsUnique();

        builder.HasIndex(access => access.MemberId);

        builder.HasIndex(access => new
        {
            access.MeetingId,
            access.Status,
        });

        builder.HasOne(access => access.Meeting)
            .WithMany()
            .HasForeignKey(access => access.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(access => access.Member)
            .WithMany()
            .HasForeignKey(access => access.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(
                access => access.StatusChangedByUser)
            .WithMany()
            .HasForeignKey(
                access => access.StatusChangedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}