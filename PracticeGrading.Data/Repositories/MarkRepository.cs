// <copyright file="MarkRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Class for interacting with the mark entities.
/// </summary>
/// <param name="context"> Database context.</param>
public class MarkRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new member mark.
    /// </summary>
    /// <param name="memberMark">New member mark.</param>
    public async Task CreateMemberMark(MemberMark memberMark)
    {
        await context.MemberMarks.AddAsync(memberMark);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates member mark.
    /// </summary>
    /// <param name="memberMark">Member mark to update.</param>
    public async Task Update(MemberMark memberMark)
    {
        context.MemberMarks.Update(memberMark);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets member mark by id.
    /// </summary>
    /// <param name="memberId">Member id.</param>
    /// <param name="workId">Student work id.</param>
    /// <returns>Member mark.</returns>
    public async Task<MemberMark?> GetById(int memberId, int workId) =>
        await context.MemberMarks
            .Include(mark => mark.CriteriaMarks)
            .FirstOrDefaultAsync(memberMark => memberMark.MemberId == memberId && memberMark.StudentWorkId == workId);

    /// <summary>
    /// Gets all member marks.
    /// </summary>
    /// <returns>List of member marks.</returns>
    public async Task<List<MemberMark>> GetAll() =>
        await context.MemberMarks.Include(mark => mark.CriteriaMarks).ToListAsync();

    /// <summary>
    /// Deletes member mark.
    /// </summary>
    /// <param name="memberMark">Member mark to delete.</param>
    public async Task Delete(MemberMark memberMark)
    {
        context.MemberMarks.Remove(memberMark);
        await context.SaveChangesAsync();
    }
}