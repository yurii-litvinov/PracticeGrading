// <copyright file="MemberMarkConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of member mark entity.
/// </summary>
public class MemberMarkConfiguration : IEntityTypeConfiguration<MemberMark>
{
    /// <summary>
    /// Configures member mark entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<MemberMark> builder) =>
        builder.HasKey(mark => mark.Id);
}