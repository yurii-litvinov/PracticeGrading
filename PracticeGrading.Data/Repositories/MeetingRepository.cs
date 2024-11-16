// <copyright file="MeetingRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using Entities;

/// <summary>
/// Сlass for interacting with the meeting entity.
/// </summary>
/// <param name="context"> Database context.</param>
public class MeetingRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new meeting.
    /// </summary>
    /// <param name="meeting">New meeting.</param>
    public async Task Create(Meeting meeting)
    {
        await context.Meetings.AddAsync(meeting);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates meeting.
    /// </summary>
    /// <param name="meeting">Meeting to update.</param>
    public async Task Update(Meeting meeting)
    {
        context.Meetings.Update(meeting);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets meeting by id.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>Meeting.</returns>
    public async Task<Meeting?> GetById(int id) =>
        await context.Meetings
            .Include(meeting => meeting.Members)
            .Include(meeting => meeting.StudentWorks)
            .Include(meeting => meeting.Criteria)
            .FirstOrDefaultAsync(meeting => meeting.Id == id);

    /// <summary>
    /// Gets all meetings.
    /// </summary>
    /// <returns>List of meetings.</returns>
    public async Task<List<Meeting>> GetAll() => await context.Meetings.ToListAsync();

    /// <summary>
    /// Deletes meeting.
    /// </summary>
    /// <param name="meeting">Meeting to delete.</param>
    public async Task Delete(Meeting meeting)
    {
        context.Meetings.Remove(meeting);
        await context.SaveChangesAsync();
    }
}