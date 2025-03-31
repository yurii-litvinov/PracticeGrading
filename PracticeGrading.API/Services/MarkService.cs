// <copyright file="MarkService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with marks.
/// </summary>
/// <param name="markRepository">Repository for marks.</param>
public class MarkService(MarkRepository markRepository)
{
    /// <summary>
    /// Adds member mark.
    /// </summary>
    /// <param name="request">Member mark request.</param>
    public async Task AddMemberMark(MemberMarkRequest request)
    {
        var memberMark = new MemberMark
        {
            MemberId = request.MemberId,
            StudentWorkId = request.StudentWorkId,
            Mark = request.Mark,
            Comment = request.Comment,
            CriteriaMarks = [],
        };

        foreach (var markRequest in request.CriteriaMarks)
        {
            memberMark.CriteriaMarks.Add(
                new CriteriaMark
                {
                    CriteriaId = markRequest.CriteriaId,
                    Mark = markRequest.Mark,
                    Comment = markRequest.Comment,
                    SelectedRules = markRequest.SelectedRules.Select(
                        ruleRequest => new SelectedRule
                        {
                            RuleId = ruleRequest.RuleId,
                            Value = ruleRequest.Value,
                        }).ToList(),
                });
        }

        await markRepository.Create(memberMark);
    }

    /// <summary>
    /// Updates member mark.
    /// </summary>
    /// <param name="request">Member mark request.</param>
    public async Task UpdateMemberMark(MemberMarkRequest request)
    {
        var memberMark = await markRepository.GetById(request.MemberId, request.StudentWorkId) ??
                         throw new InvalidOperationException(
                             $"Member mark with member ID {request.MemberId} and student work ID {request.StudentWorkId}  was not found.");

        memberMark.Mark = request.Mark;
        memberMark.Comment = request.Comment;

        foreach (var markRequest in request.CriteriaMarks)
        {
            var existingCriteriaMark = (memberMark.CriteriaMarks ?? [])
                .FirstOrDefault(criteriaMark => criteriaMark.CriteriaId == markRequest.CriteriaId);

            if (existingCriteriaMark != null)
            {
                existingCriteriaMark.Mark = markRequest.Mark;
                existingCriteriaMark.Comment = markRequest.Comment;
                existingCriteriaMark.SelectedRules.Clear();
                existingCriteriaMark.SelectedRules = markRequest.SelectedRules.Select(
                    ruleRequest => new SelectedRule
                    {
                        RuleId = ruleRequest.RuleId,
                        Value = ruleRequest.Value,
                    }).ToList();
            }
            else
            {
                memberMark.CriteriaMarks?.Add(
                    new CriteriaMark
                    {
                        CriteriaId = markRequest.CriteriaId,
                        Mark = markRequest.Mark,
                        Comment = markRequest.Comment,
                        SelectedRules = markRequest.SelectedRules.Select(
                            ruleRequest => new SelectedRule
                            {
                                RuleId = ruleRequest.RuleId,
                                Value = ruleRequest.Value,
                            }).ToList(),
                    });
            }
        }

        var criteriaMarksToRemove = (memberMark.CriteriaMarks ?? [])
            .Where(mark => request.CriteriaMarks.All(markRequest => markRequest.CriteriaId != mark.CriteriaId))
            .ToList();

        foreach (var mark in criteriaMarksToRemove)
        {
            memberMark.CriteriaMarks?.Remove(mark);
        }

        await markRepository.Update(memberMark);
    }

    /// <summary>
    /// Gets member mark by id or all marks.
    /// </summary>
    /// <param name="workId">Student work id.</param>
    /// <param name="memberId">Member id.</param>
    /// <returns>List of member marks.</returns>
    public async Task<List<MemberMarkDto>> GetMemberMarks(int workId, int? memberId = null)
    {
        List<MemberMark> memberMarks;
        if (memberId == null)
        {
            memberMarks = await markRepository.GetAll(workId);
        }
        else
        {
            var memberMark = await markRepository.GetById((int)memberId, workId);

            if (memberMark == null)
            {
                return
                [
                    new MemberMarkDto(
                        0,
                        (int)memberId,
                        workId,
                        [],
                        0,
                        string.Empty)
                ];
            }

            memberMarks = [memberMark];
        }

        var dtoList = memberMarks.Select(
                memberMark => new MemberMarkDto(
                    memberMark.Id,
                    memberMark.MemberId,
                    memberMark.StudentWorkId,
                    memberMark.CriteriaMarks.Select(
                            mark => new CriteriaMarkDto(
                                mark.Id,
                                mark.CriteriaId,
                                mark.MemberMarkId,
                                mark.Comment ?? string.Empty,
                                new List<SelectedRuleDto>(
                                        mark.SelectedRules.Select(rule => new SelectedRuleDto(rule.RuleId, rule.Value)))
                                    .ToList(),
                                mark.Mark))
                        .ToList(),
                    memberMark.Mark,
                    memberMark.Comment ?? string.Empty))
            .ToList();

        return dtoList;
    }

    /// <summary>
    /// Deletes member mark.
    /// </summary>
    /// <param name="workId">Student work id.</param>
    /// <param name="memberId">Member id.</param>
    public async Task DeleteMemberMark(int workId, int memberId)
    {
        var memberMark = await markRepository.GetById(memberId, workId) ??
                         throw new InvalidOperationException(
                             $"Member mark with member ID {memberId} and student work ID {workId}  was not found.");

        await markRepository.Delete(memberMark);
    }
}