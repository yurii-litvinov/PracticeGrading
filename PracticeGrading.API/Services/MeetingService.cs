// <copyright file="MeetingService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with meetings.
/// </summary>
/// <param name="meetingRepository">Repository for meetings.</param>
public class MeetingService(
    MeetingRepository meetingRepository,
    CriteriaRepository criteriaRepository,
    UserRepository userRepository)
{
    /// <summary>
    /// Adds new meeting.
    /// </summary>
    /// <param name="request">Meeting creation request.</param>
    public async Task AddMeeting(MeetingRequest request)
    {
        var meeting = new Meeting
        {
            DateAndTime = request.DateAndTime,
            Auditorium = request.Auditorium,
            Info = request.Info,
            CallLink = request.CallLink,
            MaterialsLink = request.MaterialsLink,
            StudentWorks = request.StudentWorks.Select(
                worksRequest => new StudentWork
                {
                    StudentName = worksRequest.StudentName,
                    Theme = worksRequest.Theme,
                    Supervisor = worksRequest.Supervisor,
                    Consultant = worksRequest.Consultant,
                    Reviewer = worksRequest.Reviewer,
                    SupervisorMark = worksRequest.SupervisorMark,
                    ReviewerMark = worksRequest.ReviewerMark,
                    CodeLink = worksRequest.CodeLink,
                }).ToList(),
            Members = request.Members.Select(
                memberRequest => new User
                {
                    UserName = memberRequest.Name,
                    PasswordHash = string.Empty,
                    RoleId = (int)RolesEnum.Member,
                }).ToList(),
            Criteria = await this.GetCriteria(request.CriteriaId),
        };

        await meetingRepository.Create(meeting);
    }

    /// <summary>
    /// Gets meeting by id or all meetings.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>List of meetings.</returns>
    public async Task<List<MeetingDto>> GetMeeting(int? id = null)
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
            var studentWorks = (meeting.StudentWorks ?? []).Select(
                work => new StudentWorkDto(
                    work.Id,
                    work.StudentName,
                    work.Theme,
                    work.Supervisor,
                    work.Consultant,
                    work.Reviewer,
                    work.SupervisorMark,
                    work.ReviewerMark,
                    work.CodeLink)).ToList();

            var members = (meeting.Members ?? []).Select(
                member =>
                    new MemberDto(member.Id, member.UserName)).ToList();

            var criteriaList = await this.GetCriteria((meeting.Criteria ?? []).Select(element => element.Id).ToList());

            var criteriaDto = criteriaList.Select(
                    criteria => new CriteriaDto(
                        criteria.Id,
                        criteria.Name,
                        criteria.Comment,
                        (criteria.Rules ?? []).Where(rule => rule.IsScaleRule).Select(
                            rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule)).ToList(),
                        (criteria.Rules ?? []).Where(rule => !rule.IsScaleRule).Select(
                            rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule)).ToList()))
                .ToList();

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
                    criteriaDto));
        }

        return meetingsDto;
    }

    /// <summary>
    /// Updates meeting.
    /// </summary>
    /// <param name="request">Meeting updating request.</param>
    public async Task UpdateMeeting(MeetingRequest request)
    {
        if (request.Id != null)
        {
            var meeting = await meetingRepository.GetById((int)request.Id) ??
                          throw new InvalidOperationException($"Meeting with ID {request.Id} was not found.");

            meeting.DateAndTime = request.DateAndTime;
            meeting.Auditorium = request.Auditorium;
            meeting.Info = request.Info;
            meeting.CallLink = request.CallLink;
            meeting.MaterialsLink = request.MaterialsLink;

            foreach (var work in request.StudentWorks)
            {
                var existingWork = (meeting.StudentWorks ?? [])
                    .FirstOrDefault(studentWork => studentWork.Id == work.Id);

                if (existingWork != null)
                {
                    existingWork.StudentName = work.StudentName;
                    existingWork.Theme = work.Theme;
                    existingWork.Supervisor = work.Supervisor;
                    existingWork.Consultant = work.Consultant;
                    existingWork.Reviewer = work.Reviewer;
                    existingWork.SupervisorMark = work.SupervisorMark;
                    existingWork.ReviewerMark = work.ReviewerMark;
                    existingWork.CodeLink = work.CodeLink;
                }
                else
                {
                    meeting.StudentWorks?.Add(
                        new StudentWork
                        {
                            StudentName = work.StudentName,
                            Theme = work.Theme,
                            Supervisor = work.Supervisor,
                            Consultant = work.Consultant,
                            Reviewer = work.Reviewer,
                            SupervisorMark = work.SupervisorMark,
                            ReviewerMark = work.ReviewerMark,
                            CodeLink = work.CodeLink,
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

            foreach (var memberRequest in request.Members)
            {
                var existingMember = (meeting.Members ?? [])
                    .FirstOrDefault(member => member.Id == memberRequest.Id);

                if (existingMember != null)
                {
                    existingMember.UserName = memberRequest.Name;
                }
                else
                {
                    meeting.Members?.Add(
                        new User
                        {
                            UserName = memberRequest.Name,
                            PasswordHash = string.Empty,
                            RoleId = (int)RolesEnum.Member,
                        });
                }
            }

            var membersToRemove = (meeting.Members ?? [])
                .Where(
                    member => request.Members.All(
                        memberRequest => memberRequest.Id != null && memberRequest.Id != member.Id)).ToList();

            foreach (var member in membersToRemove)
            {
                await userRepository.Delete(member);
            }

            meeting.Criteria = await this.GetCriteria(request.CriteriaId);

            await meetingRepository.Update(meeting);
        }
    }

    /// <summary>
    /// Gets meeting members.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    public async Task<List<string>> GetMembers(int id)
    {
        var meeting = await meetingRepository.GetById(id) ??
                      throw new InvalidOperationException($"Meeting with ID {id} was not found.");

        return (meeting.Members ?? []).Select(member => member.UserName).ToList();
    }

    /// <summary>
    /// Deletes meeting.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    public async Task DeleteMeeting(int id)
    {
        var meeting = await meetingRepository.GetById(id) ??
                      throw new InvalidOperationException($"Meeting with ID {id} was not found.");

        await meetingRepository.Delete(meeting);
    }

    /// <summary>
    /// Gets student work by Id.
    /// </summary>
    /// <param name="meetingId">Meeting id.</param>
    /// <param name="workId">Student work id.</param>
    public async Task<StudentWorkDto> GetStudentWork(int meetingId, int workId)
    {
        var meeting = await meetingRepository.GetById(meetingId) ??
                      throw new InvalidOperationException($"Meeting with ID {meetingId} was not found.");
        var studentWork = (meeting.StudentWorks ?? []).FirstOrDefault(work => work.Id == workId) ??
                          throw new InvalidOperationException($"Student work with ID {workId} was not found.");

        return new StudentWorkDto(
            studentWork.Id,
            studentWork.StudentName,
            studentWork.Theme,
            studentWork.Supervisor,
            studentWork.Consultant,
            studentWork.Reviewer,
            studentWork.SupervisorMark,
            studentWork.ReviewerMark,
            studentWork.CodeLink);
    }

    private async Task<List<Criteria>> GetCriteria(List<int> idList)
    {
        var criteria = new List<Criteria>();

        foreach (var id in idList)
        {
            criteria.Add(
                await criteriaRepository.GetById(id) ??
                throw new InvalidOperationException($"Criteria with ID {id} was not found."));
        }

        return criteria;
    }
}