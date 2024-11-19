// <copyright file="UserConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of user entity.
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    /// <summary>
    /// Configures user entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);

        builder.HasOne<Role>(user => user.Role)
            .WithMany(role => role.Users)
            .HasForeignKey(user => user.RoleId);

        builder.HasMany<MemberMark>(member => member.Marks)
            .WithOne(mark => mark.Member)
            .HasForeignKey(mark => mark.MemberId);

        builder.HasData(
            new User
            {
                Id = 1,
                UserName = "admin",
                PasswordHash = "$2a$11$0CCsMkYMzLq/5/tvvlwb/OpAaYuXul1te/yuKAYm9unI5fehP5r82",
                RoleId = 1,
            });
    }
}