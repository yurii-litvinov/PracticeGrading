// <copyright file="AppDbContext.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data;

using Microsoft.EntityFrameworkCore;
using Configurations;
using Entities;

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
    /// Gets or sets Roles table.
    /// </summary>
    public DbSet<Role> Roles { get; set; }

    /// <summary>
    /// Gets or sets Meetings table.
    /// </summary>
    public DbSet<Meeting> Meetings { get; set; }

    /// <summary>
    /// Gets or sets Criteria table.
    /// </summary>
    public DbSet<Criteria> Criteria { get; set; }

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

        modelBuilder.ApplyConfiguration(new CriteriaConfiguration());
        modelBuilder.ApplyConfiguration(new RuleConfiguration());
        modelBuilder.ApplyConfiguration(new CriteriaMarkConfiguration());
    }
}