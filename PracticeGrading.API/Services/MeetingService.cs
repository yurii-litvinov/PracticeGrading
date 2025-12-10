// <copyright file="MeetingService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Integrations;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;
using System.Text.Json;

/// <summary>
/// Service for working with meetings.
/// </summary>
/// <param name="meetingRepository">Repository for meetings.</param>
public class MeetingService(
    MeetingRepository meetingRepository,
    CriteriaGroupRepository criteriaGroupRepository,
    UserRepository userRepository,
    MarkRepository markRepository)
{
    /// <summary>
    /// Adds new meeting.
    /// </summary>
    /// <param name="request">Meeting creation request.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task AddMeeting(MeetingRequest request)
    {
        var group = await criteriaGroupRepository.GetById(request.CriteriaGroupId) ??
                    throw new InvalidOperationException(
                        $"Criteria group with ID {request.CriteriaGroupId} was not found.");

        var meeting = new Meeting
        {
            DateAndTime = request.DateAndTime,
            Auditorium = request.Auditorium,
            Info = request.Info,
            CallLink = request.CallLink,
            MaterialsLink = request.MaterialsLink,
            StudentWorks = request.StudentWorks.Select(
                workRequest => new StudentWork
                {
                    StudentName = workRequest.StudentName,
                    Info = workRequest.Info,
                    Theme = workRequest.Theme,
                    Supervisor = workRequest.Supervisor,
                    SupervisorInfo = workRequest.SupervisorInfo,
                    Consultant = workRequest.Consultant,
                    Reviewer = workRequest.Reviewer,
                    ReviewerInfo = workRequest.ReviewerInfo,
                    SupervisorMark = workRequest.SupervisorMark,
                    ReviewerMark = workRequest.ReviewerMark,
                    CodeLink = workRequest.CodeLink,
                    ReportLink = workRequest.ReportLink,
                    SupervisorReviewLink = workRequest.SupervisorReviewLink,
                    ConsultantReviewLink = workRequest.ConsultantReviewLink,
                    ReviewerReviewLink = workRequest.ReviewerReviewLink,
                    AdditionalLink = workRequest.AdditionalLink,
                    AverageCriteriaMarks = (group.Criteria ?? [])
                        .Select(criteria => new AverageCriteriaMark { CriteriaId = criteria.Id })
                        .ToList(),
                }).ToList(),
            Members = await userRepository.GetUsersByIdsAsync(request.MemberIds),
            CriteriaGroup = group,
        };

        await meetingRepository.Create(meeting);
    }

    /// <summary>
    /// Gets meeting by id or all meetings.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>List of meetings.</returns>
    public async Task<List<MeetingDto>> GetMeeting(int? id = null, bool isMemberRequest = false)
    {
        List<Meeting> meetings;
        if (id == null)
        {
            meetings = await meetingRepository.GetAll();
        }
        else
        {
            meetings =
            [
                await meetingRepository.GetById(id.Value) ??
                throw new InvalidOperationException($"Meeting with ID {id.Value} was not found.")
            ];
        }

        var meetingsDto = new List<MeetingDto>();

        foreach (var meeting in meetings)
        {
            var studentWorks = meeting.StudentWorks.Select(
                work => new StudentWorkDto(
                    work.Id,
                    work.StudentName,
                    work.Info,
                    work.Theme,
                    work.Supervisor,
                    work.SupervisorInfo,
                    work.Consultant,
                    work.Reviewer,
                    work.ReviewerInfo,
                    work.SupervisorMark,
                    work.ReviewerMark,
                    work.CodeLink,
                    work.ReportLink,
                    work.SupervisorReviewLink,
                    work.ConsultantReviewLink,
                    work.ReviewerReviewLink,
                    work.AdditionalLink,
                    work.AverageCriteriaMarks
                        .Select(mark => new AverageCriteriaMarkDto(mark.CriteriaId, mark.AverageMark)).ToList(),
                    work.FinalMark)).ToList();

            var members = (meeting.Members ?? []).Select(UserService.GetMemberDtoFromUser).ToList();

            if (isMemberRequest)
            {
                members = members.Select(m => new MemberDto(m.Id, m.Name, string.Empty, string.Empty, string.Empty, string.Empty)).ToList();
            }

            var group = meeting.CriteriaGroup;

            var scaleDto = (group?.MarkScales ?? [])
                .Select(scale => new MarkScaleDto(scale.Id, scale.Min, scale.Max, scale.Mark)).ToList();

            var groupDto = new CriteriaGroupDto(group!.Id, group.Name, group.MetricType, [], scaleDto);

            meetingsDto.Add(
                new MeetingDto(
                    meeting.Id,
                    meeting.DateAndTime,
                    meeting.Auditorium,
                    meeting.Info,
                    meeting.CallLink,
                    meeting.MaterialsLink,
                    studentWorks,
                    members,
                    groupDto));
        }

        return meetingsDto;
    }

    /// <summary>
    /// Updates meeting.
    /// </summary>
    /// <param name="request">Meeting updating request.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task UpdateMeeting(MeetingRequest request)
    {
        if (request.Id != null)
        {
            var group = await criteriaGroupRepository.GetById(request.CriteriaGroupId) ??
                        throw new InvalidOperationException(
                            $"Criteria group with ID {request.CriteriaGroupId} was not found.");

            var meeting = await meetingRepository.GetById((int)request.Id) ??
                          throw new InvalidOperationException($"Meeting with ID {request.Id} was not found.");

            meeting.DateAndTime = request.DateAndTime;
            meeting.Auditorium = request.Auditorium;
            meeting.Info = request.Info;
            meeting.CallLink = request.CallLink;
            meeting.MaterialsLink = request.MaterialsLink;
            meeting.CriteriaGroup = group;

            foreach (var work in request.StudentWorks)
            {
                var existingWork = (meeting.StudentWorks ?? [])
                    .FirstOrDefault(studentWork => studentWork.Id == work.Id);

                if (existingWork != null)
                {
                    existingWork.StudentName = work.StudentName;
                    existingWork.Info = work.Info;
                    existingWork.Theme = work.Theme;
                    existingWork.Supervisor = work.Supervisor;
                    existingWork.SupervisorInfo = work.SupervisorInfo;
                    existingWork.Consultant = work.Consultant;
                    existingWork.Reviewer = work.Reviewer;
                    existingWork.ReviewerInfo = work.ReviewerInfo;
                    existingWork.SupervisorMark = work.SupervisorMark;
                    existingWork.ReviewerMark = work.ReviewerMark;
                    existingWork.CodeLink = work.CodeLink;
                    existingWork.ReportLink = work.ReportLink;
                    existingWork.SupervisorReviewLink = work.SupervisorReviewLink;
                    existingWork.ConsultantReviewLink = work.ConsultantReviewLink;
                    existingWork.ReviewerReviewLink = work.ReviewerReviewLink;
                    existingWork.AdditionalLink = work.AdditionalLink;

                    foreach (var criteria in (group.Criteria ?? []).Where(
                                 criteria => existingWork.AverageCriteriaMarks.FirstOrDefault(
                                     mark => mark.CriteriaId == criteria.Id) == null))
                    {
                        existingWork.AverageCriteriaMarks?.Add(new AverageCriteriaMark { CriteriaId = criteria.Id });
                    }

                    var marksToRemove = (existingWork.AverageCriteriaMarks ?? []).Where(
                        mark => (group.Criteria ?? []).All(criteria => mark.CriteriaId != criteria.Id));

                    foreach (var mark in marksToRemove)
                    {
                        existingWork.AverageCriteriaMarks?.Remove(mark);
                    }
                }
                else
                {
                    meeting.StudentWorks?.Add(
                        new StudentWork
                        {
                            StudentName = work.StudentName,
                            Info = work.Info,
                            Theme = work.Theme,
                            Supervisor = work.Supervisor,
                            SupervisorInfo = work.SupervisorInfo,
                            Consultant = work.Consultant,
                            Reviewer = work.Reviewer,
                            ReviewerInfo = work.ReviewerInfo,
                            SupervisorMark = work.SupervisorMark,
                            ReviewerMark = work.ReviewerMark,
                            CodeLink = work.CodeLink,
                            ReportLink = work.ReportLink,
                            SupervisorReviewLink = work.SupervisorReviewLink,
                            ConsultantReviewLink = work.ConsultantReviewLink,
                            ReviewerReviewLink = work.ReviewerReviewLink,
                            AdditionalLink = work.AdditionalLink,
                            AverageCriteriaMarks =
                                (group.Criteria ?? []).Select(
                                    criteria => new AverageCriteriaMark { CriteriaId = criteria.Id }).ToList(),
                        });
                }
            }

            var worksToRemove = (meeting.StudentWorks ?? [])
                .Where(
                    work => request.StudentWorks.All(
                        workRequest => workRequest.Id != null && workRequest.Id != work.Id)).ToList();

            foreach (var work in worksToRemove)
            {
                meeting.StudentWorks?.Remove(work);
            }

            var membersToRemove = meeting.Members!
                .Where(member => !request.MemberIds.Contains(member.Id))
                .ToList();

            foreach (var member in membersToRemove)
            {
                var marks = await markRepository.GetAll();
                foreach (var mark in marks.Where(mark => mark.MemberId == member.Id))
                {
                    await markRepository.Delete(mark);
                }
            }

            meeting.Members = meeting.Members!
                .Where(m => !membersToRemove.Select(mr => mr.Id).Contains(m.Id))
                .ToList();

            var newMemberIds = request.MemberIds.Except(meeting.Members.Select(m => m.Id));

            foreach (var newMemberId in newMemberIds)
            {
                var newMember = await userRepository.GetUserById(newMemberId);

                if (newMember == null)
                {
                    throw new InvalidOperationException("Unable to add new member for the meeting");
                }

                meeting.Members.Add(newMember);
            }

            await meetingRepository.Update(meeting);
        }
    }

    /// <summary>
    /// Deletes meeting.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task DeleteMeeting(int id)
    {
        var meeting = await meetingRepository.GetById(id) ??
                      throw new InvalidOperationException($"Meeting with ID {id} was not found.");

        await meetingRepository.Delete(meeting);
    }

    /// <summary>
    /// Gets meeting members.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>A list of member DTOs representing the meeting participants.</returns>
    public async Task<List<MemberDto>> GetMembers(int id)
    {
        var meeting = await meetingRepository.GetById(id) ??
                      throw new InvalidOperationException($"Meeting with ID {id} was not found.");

        return (meeting.Members ?? []).Select(UserService.GetMemberDtoFromUser).ToList();
    }

    /// <summary>
    /// Sets the student's final mark.
    /// </summary>
    /// <param name="meetingId">Meeting id.</param>
    /// <param name="workId">Student work id.</param>
    /// <param name="mark">Final mark.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task SetFinalMark(int meetingId, int workId, string mark)
    {
        var meeting = await meetingRepository.GetById(meetingId) ??
                      throw new InvalidOperationException($"Meeting with ID {meetingId} was not found.");

        var work = meeting.StudentWorks.FirstOrDefault(work => work.Id == workId);
        if (work != null)
        {
            work.FinalMark = mark;
            await meetingRepository.Update(meeting);
        }
    }

    /// <summary>
    /// Creates meetings from file.
    /// </summary>
    /// <param name="request">Schedule parsing request.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task CreateMeetingsFromFile(ParseScheduleRequest request)
    {
        var parser = new ScheduleParser(
            request.File.OpenReadStream(),
            JsonSerializer.Deserialize<List<string>>(request.Headers) ?? [],
            JsonSerializer.Deserialize<List<List<string>>>(request.Separator) ?? [],
            request.MembersColumn);

        var meetings = parser.Parse();

        foreach (var meeting in meetings)
        {
            meeting.CriteriaGroup = await criteriaGroupRepository.GetById(1) ??
                                    throw new InvalidOperationException($"Criteria group with ID 1 was not found.");
            await meetingRepository.Create(meeting);
        }
    }
}