// <copyright file="MeetingMemberAccessRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;

/// <summary>
/// Provides database operations for meeting member access requests.
/// </summary>
/// <param name="context">Application database context.</param>
public class MeetingMemberAccessRepository(AppDbContext context)
{
    /// <summary>
    /// Returns an access request by its identifier.
    /// </summary>
    /// <param name="accessId">Access request identifier.</param>
    /// <returns>
    /// The access request, or <see langword="null"/> if it was not found.
    /// </returns>
    public async Task<MeetingMemberAccess?> GetById(int accessId)
    {
        return await context.MeetingMemberAccesses
            .Include(access => access.Member)
            .ThenInclude(member => member!.Role)
            .FirstOrDefaultAsync(access => access.Id == accessId);
    }

    /// <summary>
    /// Returns an access request by its token hash.
    /// </summary>
    /// <param name="tokenHash">SHA-256 hash of the access token.</param>
    /// <returns>
    /// The access request, or <see langword="null"/> if it was not found.
    /// </returns>
    public async Task<MeetingMemberAccess?> GetByTokenHash(string tokenHash)
    {
        return await context.MeetingMemberAccesses
            .Include(access => access.Member)
            .ThenInclude(member => member!.Role)
            .FirstOrDefaultAsync(access => access.TokenHash == tokenHash);
    }

    /// <summary>
    /// Returns pending access requests for a meeting.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <returns>A collection of pending access requests.</returns>
    public async Task<List<MeetingMemberAccess>> GetPendingByMeetingId(int meetingId)
    {
        return await context.MeetingMemberAccesses
                .Include(access => access.Member)
            .ThenInclude(member => member!.Role)
            .Where(access =>
                access.MeetingId == meetingId &&
                access.Status == MeetingMemberAccessStatus.Pending)
            .OrderBy(access => access.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Adds a new access request to the database.
    /// </summary>
    /// <param name="access">Access request to add.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task Create(MeetingMemberAccess access)
    {
        await context.MeetingMemberAccesses.AddAsync(access);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Saves changes made to tracked access requests.
    /// </summary>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Returns approved accesses for the specified meeting.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <returns>Approved meeting accesses.</returns>
    public async Task<List<MeetingMemberAccess>>
        GetApprovedByMeetingId(int meetingId)
    {
        return await context.MeetingMemberAccesses
            .Where(access =>
                access.MeetingId == meetingId &&
                access.Status ==
                    MeetingMemberAccessStatus.Approved)
            .Include(access => access.Member)
            .OrderByDescending(access =>
                access.StatusChangedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Determines whether the specified meeting access is approved
    /// and belongs to the specified member and meeting.
    /// </summary>
    /// <param name="accessId">
    /// The meeting access identifier.
    /// </param>
    /// <param name="memberId">
    /// The commission member identifier.
    /// </param>
    /// <param name="meetingId">
    /// The meeting identifier.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if the access is active;
    /// otherwise, <see langword="false"/>.
    /// </returns>
    public async Task<bool> IsActive(
        int accessId,
        int memberId,
        int meetingId)
    {
        return await context.MeetingMemberAccesses
            .AnyAsync(access =>
                access.Id == accessId &&
                access.MemberId == memberId &&
                access.MeetingId == meetingId &&
                access.Status ==
                    MeetingMemberAccessStatus.Approved);
    }
}