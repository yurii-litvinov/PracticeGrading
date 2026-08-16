// <copyright file="MeetingRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Class for interacting with the meeting entity.
/// </summary>
/// <param name="context"> Database context.</param>
public class MeetingRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new meeting.
    /// </summary>
    /// <param name="meeting">New meeting.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task Create(Meeting meeting)
    {
        await context.Meetings.AddAsync(meeting);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates meeting.
    /// </summary>
    /// <param name="meeting">Meeting to update.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
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
            .Include(meeting => meeting.StudentWorks).ThenInclude(work => work.AverageCriteriaMarks)
            .Include(meeting => meeting.CriteriaGroup).ThenInclude(group => group.MarkScales)
            .FirstOrDefaultAsync(meeting => meeting.Id == id);

    /// <summary>
    /// Gets all meetings.
    /// </summary>
    /// <returns>List of meetings.</returns>
    public async Task<List<Meeting>> GetAll() => await context.Meetings.Include(meeting => meeting.StudentWorks)
        .ThenInclude(work => work.AverageCriteriaMarks)
        .Include(meeting => meeting.CriteriaGroup)
        .Include(meeting => meeting.Members).ToListAsync();

    /// <summary>
    /// Deletes meeting.
    /// </summary>
    /// <param name="meeting">Meeting to delete.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task Delete(Meeting meeting)
    {
        context.Meetings.Remove(meeting);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Adds a commission member to a meeting if the relationship
    /// does not already exist.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="memberId">Commission member identifier.</param>
    /// <returns>
    /// A task representing the asynchronous operation.
    /// </returns>
    public async Task AddMemberIfMissing(
        int meetingId,
        int memberId)
    {
        if (context.Database.IsRelational())
        {
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"""
             INSERT INTO "MeetingUser" (
                 "MeetingsId",
                 "MembersId"
             )
             VALUES (
                 {meetingId},
                 {memberId}
             )
             ON CONFLICT ON CONSTRAINT "PK_MeetingUser"
             DO NOTHING;
             """);

            return;
        }

        var meeting = await this.GetById(meetingId)
            ?? throw new InvalidOperationException(
                $"Meeting with ID {meetingId} was not found.");

        var member = await context.Users.FindAsync(memberId)
            ?? throw new InvalidOperationException(
                $"Member with ID {memberId} was not found.");

        if (meeting.Members.All(existingMember =>
            existingMember.Id != memberId))
        {
            meeting.Members.Add(member);
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Removes a user from a specific meeting.
    /// </summary>
    /// <param name="meetingId">The ID of the meeting to remove the user from.</param>
    /// <param name="userId">The ID of the user to remove from the meeting.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the meeting is not found or the user is not related to the meeting.
    /// </exception>
    public async Task RemoveUserFromMeeting(int meetingId, int userId)
    {
        var meeting = await this.GetById(meetingId);

        if (meeting == null)
        {
            throw new InvalidOperationException($"Meeting with {meetingId} id was not found");
        }

        var user = await context.Users.FindAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException($"User with {userId} id is not related to the meeting with {meetingId} id.");
        }

        meeting.Members!.Remove(user);
        await context.SaveChangesAsync();
    }
}