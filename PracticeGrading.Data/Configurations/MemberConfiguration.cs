// <copyright file="MemberConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Entities;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// The class for configuration of member entity.
/// </summary>
public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    /// <summary>
    /// Configures member entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<Member> builder) =>
        builder.HasMany<MemberMark>(member => member.Marks)
            .WithOne(mark => mark.Member)
            .HasForeignKey(mark => mark.MemberId);
}