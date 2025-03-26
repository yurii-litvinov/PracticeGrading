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
    public async Task Create(MemberMark memberMark)
    {
        await context.MemberMarks.AddAsync(memberMark);
        await context.SaveChangesAsync();

        var mark = await this.GetById(memberMark.MemberId, memberMark.StudentWorkId);

        if (mark?.StudentWork != null)
        {
            await this.CalculateAverageCriteriaMarks(mark.StudentWork);
        }
    }

    /// <summary>
    /// Updates member mark.
    /// </summary>
    /// <param name="memberMark">Member mark to update.</param>
    public async Task Update(MemberMark memberMark)
    {
        context.MemberMarks.Update(memberMark);
        await context.SaveChangesAsync();

        if (memberMark.StudentWork != null)
        {
            await this.CalculateAverageCriteriaMarks(memberMark.StudentWork);
        }
    }

    /// <summary>
    /// Gets member mark by id.
    /// </summary>
    /// <param name="memberId">Member id.</param>
    /// <param name="workId">Student work id.</param>
    /// <returns>Member mark.</returns>
    public async Task<MemberMark?> GetById(int memberId, int workId)
    {
        var memberMark = await context.MemberMarks
            .Include(mark => mark.StudentWork)
            .Include(mark => mark.CriteriaMarks).ThenInclude(criteriaMark => criteriaMark.SelectedRules)
            .FirstOrDefaultAsync(memberMark => memberMark.MemberId == memberId && memberMark.StudentWorkId == workId);

        if (memberMark?.StudentWork != null)
        {
            await context.Entry(memberMark.StudentWork)
                .Collection(work => work.AverageCriteriaMarks)
                .LoadAsync();
        }

        return memberMark;
    }

    /// <summary>
    /// Gets all member marks.
    /// </summary>
    /// <param name="workId">Student work id.</param>
    /// <returns>List of member marks.</returns>
    public async Task<List<MemberMark>> GetAll(int workId)
    {
        return await context.MemberMarks
            .Include(mark => mark.CriteriaMarks).ThenInclude(criteriaMark => criteriaMark.SelectedRules)
            .Where(mark => mark.StudentWorkId == workId)
            .ToListAsync();
    }

    /// <summary>
    /// Deletes member mark.
    /// </summary>
    /// <param name="memberMark">Member mark to delete.</param>
    public async Task Delete(MemberMark memberMark)
    {
        context.MemberMarks.Remove(memberMark);
        await context.SaveChangesAsync();

        if (memberMark.StudentWork != null)
        {
            await this.CalculateAverageCriteriaMarks(memberMark.StudentWork);
        }
    }

    private async Task CalculateAverageCriteriaMarks(StudentWork work)
    {
        var memberMarks = await this.GetAll(work.Id);

        foreach (var averageCriteriaMark in work.AverageCriteriaMarks)
        {
            var criteriaMarks = memberMarks
                .SelectMany(
                    memberMark => memberMark.CriteriaMarks
                        .Where(mark => mark.CriteriaId == averageCriteriaMark.CriteriaId))
                .Select(mark => mark.Mark)
                .ToList();

            var average = criteriaMarks.Average();
            averageCriteriaMark.AverageMark = average.HasValue ? Math.Round(average.Value, 1) : null;
        }

        work.FinalMark = string.Empty;

        await context.SaveChangesAsync();
    }
}