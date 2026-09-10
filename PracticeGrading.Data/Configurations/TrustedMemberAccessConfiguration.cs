// <copyright file="TrustedMemberAccessConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// Configures the trusted member access entity.
/// </summary>
public class TrustedMemberAccessConfiguration
    : IEntityTypeConfiguration<TrustedMemberAccess>
{
    /// <summary>
    /// Configures the trusted member access entity.
    /// </summary>
    /// <param name="builder">
    /// The builder used to configure the entity.
    /// </param>
    public void Configure(
        EntityTypeBuilder<TrustedMemberAccess> builder)
    {
        builder.HasKey(access => access.Id);

        builder.Property(access => access.TokenHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(access => access.TokenHash)
            .IsUnique();

        builder.HasOne(access => access.Member)
            .WithOne(member => member.TrustedMemberAccess)
            .HasForeignKey<TrustedMemberAccess>(
                access => access.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}