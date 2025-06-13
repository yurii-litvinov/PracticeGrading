// <copyright file="AppDbContext.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Configurations;
using PracticeGrading.Data.Entities;

/// <summary>
/// The context class for the database.
/// </summary>
public class AppDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AppDbContext"/> class.
    /// </summary>
    /// <param name="options">Options for database context.</param>
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets Users table.
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// Gets or sets Meetings table.
    /// </summary>
    public DbSet<Meeting> Meetings { get; set; }

    /// <summary>
    /// Gets or sets CriteriaGroups table.
    /// </summary>
    public DbSet<CriteriaGroup> CriteriaGroup { get; set; }

    /// <summary>
    /// Gets or sets Criteria table.
    /// </summary>
    public DbSet<Criteria> Criteria { get; set; }

    /// <summary>
    /// Gets or sets MemberMarks table.
    /// </summary>
    public DbSet<MemberMark> MemberMarks { get; set; }

    /// <summary>
    /// Sets configurations of database tables.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());

        modelBuilder.ApplyConfiguration(new StudentWorkConfiguration());
        modelBuilder.ApplyConfiguration(new MeetingConfiguration());
        modelBuilder.ApplyConfiguration(new MemberMarkConfiguration());
        modelBuilder.ApplyConfiguration(new AverageCriteriaMarkConfiguration());

        modelBuilder.ApplyConfiguration(new CriteriaGroupConfiguration());
        modelBuilder.ApplyConfiguration(new MarkScaleConfiguration());

        modelBuilder.ApplyConfiguration(new CriteriaConfiguration());
        modelBuilder.ApplyConfiguration(new RuleConfiguration());
        modelBuilder.ApplyConfiguration(new CriteriaMarkConfiguration());
        modelBuilder.ApplyConfiguration(new SelectedRuleConfiguration());

        modelBuilder.Entity("CriteriaCriteriaGroup").HasData(
            new { CriteriaGroupsId = 1, CriteriaId = 1 },
            new { CriteriaGroupsId = 1, CriteriaId = 2 },
            new { CriteriaGroupsId = 1, CriteriaId = 3 },
            new { CriteriaGroupsId = 1, CriteriaId = 4 },
            new { CriteriaGroupsId = 1, CriteriaId = 5 });
    }
}