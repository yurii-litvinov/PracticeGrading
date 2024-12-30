namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with marks.
/// </summary>
/// <param name="markRepository">Repository for marks.</param>
public class MarkService(MarkRepository markRepository, CriteriaRepository criteriaRepository)
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
            CriteriaMarks = [],
        };

        foreach (var markRequest in request.CriteriaMarks)
        {
            var criteria = await criteriaRepository.GetById(markRequest.CriteriaId);
            var rulesId = markRequest.SelectedRules.Select(ruleRequest => ruleRequest.Id);

            memberMark.CriteriaMarks.Add(
                new CriteriaMark
                {
                    CriteriaId = markRequest.CriteriaId,
                    Mark = markRequest.Mark,
                    Comment = markRequest.Comment,
                    SelectedRules = (criteria?.Rules ?? []).Where(rule => rulesId.Contains(rule.Id)).ToList(),
                });
        }

        await markRepository.CreateMemberMark(memberMark);
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
        memberMark.CriteriaMarks?.Clear();

        foreach (var markRequest in request.CriteriaMarks)
        {
            var criteria = await criteriaRepository.GetById(markRequest.CriteriaId);
            var rulesId = markRequest.SelectedRules.Select(ruleRequest => ruleRequest.Id);

            memberMark.CriteriaMarks?.Add(
                new CriteriaMark
                {
                    CriteriaId = markRequest.CriteriaId,
                    Mark = markRequest.Mark,
                    Comment = markRequest.Comment,
                    SelectedRules = (criteria?.Rules ?? []).Where(rule => rulesId.Contains(rule.Id)).ToList(),
                });
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
                        (int)workId,
                        [],
                        0)
                ];
            }

            memberMarks = [memberMark];
        }

        var dtoList = memberMarks.Select(
                memberMark => new MemberMarkDto(
                    memberMark.Id,
                    memberMark.MemberId,
                    memberMark.StudentWorkId,
                    (memberMark.CriteriaMarks ?? []).Select(
                        mark => new CriteriaMarkDto(
                            mark.Id,
                            mark.CriteriaId,
                            mark.MemberMarkId,
                            mark.Comment ?? string.Empty,
                            new List<RuleDto>(
                                    (mark.SelectedRules ?? []).Select(
                                        rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule)))
                                .ToList(),
                            mark.Mark))
                    .ToList(),
                    memberMark.Mark))
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