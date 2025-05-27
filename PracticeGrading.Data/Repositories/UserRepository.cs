// <copyright file="UserRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Class for interacting with the user entity.
/// </summary>
/// <param name="context"> Database context.</param>
public class UserRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new user.
    /// </summary>
    /// <param name="user">New user.</param>
    public async Task Create(User user)
    {
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets user by username.
    /// </summary>
    /// <param name="userName">Username.</param>
    /// <param name="meetingId">Meeting Id.</param>
    /// <returns>User.</returns>
    public async Task<User?> GetByUserName(string userName, int? meetingId = null) =>
        await context.Users.Include(user => user.Role)
            .FirstOrDefaultAsync(user => user.UserName == userName && user.MeetingId == meetingId);

    /// <summary>
    /// Updates user.
    /// </summary>
    /// <param name="user">User to update.</param>
    public async Task Update(User user)
    {
        context.Users.Update(user);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Deletes user.
    /// </summary>
    /// <param name="user">User to delete.</param>
    public async Task Delete(User user)
    {
        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }
}