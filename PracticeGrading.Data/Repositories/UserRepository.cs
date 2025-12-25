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
    /// <returns>The ID of the newly created user.</returns>
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

    /// <summary>
    /// Searches for users by name with pagination support.
    /// Only returns members.
    /// </summary>
    /// <param name="searchName">The name to search for (case-insensitive).</param>
    /// <param name="offset">The number of records to skip.</param>
    /// <param name="limit">The maximum number of records to return.</param>
    /// <returns>An array of users matching the search criteria.</returns>
    public async Task<User[]> SearchMembersByNameAsync(string searchName, int offset, int limit)
    {
        return await context.Users
            .Where(u => u.UserName.ToLower().Contains(searchName.ToLower().Trim()) && u.RoleId == 2)
            .OrderBy(u => u.UserName)
            .Skip(offset)
            .Take(limit)
            .ToArrayAsync();
    }

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// Includes the user's role and meetings in the result.
    /// </summary>
    /// <param name="id">The user ID to search for.</param>
    /// <returns>The user entity if found; otherwise, null.</returns>
    public async Task<User?> GetUserById(int id)
    {
        return await context.Users.Where(u => u.Id == id)
            .Include(u => u.Role)
            .Include(u => u.Meetings).FirstOrDefaultAsync();
    }

    /// <summary>
    /// Retrieves multiple users by their IDs.
    /// </summary>
    /// <param name="userIds">The collection of user IDs to retrieve.</param>
    /// <returns>A list of user entities.</returns>
    public async Task<List<User>> GetUsersByIdsAsync(List<int> userIds)
    {
        return await context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();
    }

    /// <summary>
    /// Adds a user to a specific meeting.
    /// </summary>
    /// <param name="userId">The ID of the user to add.</param>
    /// <param name="meetingId">The ID of the meeting to add the user to.</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the meeting or user is not found.
    /// </exception>
    /// <returns>A task that represents the asynchronous operation.</returns>
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

        meeting.Members?.Add(user);
        await meetingRepository.Update(meeting);
    }

    /// <summary>
    /// Updates user.
    /// </summary>
    /// <param name="user">User to update.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task Update(User user)
    {
        context.Users.Update(user);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Deletes user.
    /// </summary>
    /// <param name="user">User to delete.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task Delete(User user)
    {
        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }
}