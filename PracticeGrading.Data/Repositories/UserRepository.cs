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
public class UserRepository(AppDbContext context, MeetingRepository meetingRepository)
{
    /// <summary>
    /// Creates new user.
    /// </summary>
    /// <param name="user">New user.</param>
    public async Task<int> Create(User user)
    {
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        return user.Id;
    }

    /// <summary>
    /// Gets user by username.
    /// </summary>
    /// <param name="userName">Username.</param>
    /// <returns>User.</returns>
    public async Task<User?> GetByUserName(string userName)
    {
        return await context.Users.Include(user => user.Role)
            .FirstOrDefaultAsync(user => user.UserName == userName);
    }

    public async Task<User[]> SearchMembersByNameAsync(string searchName, int offset, int limit)
    {
        return await context.Users
            .Where(u => u.UserName.ToLower().Contains(searchName.ToLower().Trim()) && u.RoleId == 2)
            .OrderBy(u => u.UserName)
            .Skip(offset)
            .Take(limit)
            .ToArrayAsync();
    }

    public async Task<User?> GetUserById(int id)
    {
        return await context.Users.Where(u => u.Id == id)
            .Include(u => u.Role)
            .Include(u => u.Meetings).FirstOrDefaultAsync();
    }

    public async Task<List<User>> GetUsersByIdsAsync(List<int> userIds)
    {
        return await context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();
    }

    public async Task AddUserToMeeting(int userId, int meetingId)
    {
        var meeting = await meetingRepository.GetById(meetingId);
        var user = await this.GetUserById(userId);

        if (meeting == null)
        {
            throw new InvalidOperationException($"Meeting with id {meetingId} was not found");
        }

        if (user == null)
        {
            throw new InvalidOperationException($"User with id {userId} was not found");
        }

        meeting.Members ??= new List<User>();
        meeting.Members.Add(user);
        await meetingRepository.Update(meeting);
    }

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