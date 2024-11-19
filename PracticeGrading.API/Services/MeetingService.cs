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
public class MeetingService(MeetingRepository meetingRepository, CriteriaRepository criteriaRepository)
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
                name => new User
                {
                    UserName = name,
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

        return meetings.Select(
            meeting =>
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

                var members = (meeting.Members ?? []).Select(member => member.UserName).ToList();

                var criteriaId = (meeting.Criteria ?? []).Select(criteria => criteria.Id).ToList();

                return new MeetingDto(
                    meeting.Id,
                    meeting.DateAndTime,
                    meeting.Auditorium,
                    meeting.Info,
                    meeting.CallLink,
                    meeting.MaterialsLink,
                    studentWorks,
                    members,
                    criteriaId);
            }).ToList();
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
            meeting.StudentWorks?.Clear();
            meeting.Members?.Clear();
            meeting.Criteria?.Clear();

            foreach (var workRequest in request.StudentWorks)
            {
                meeting.StudentWorks?.Add(
                    new StudentWork
                    {
                        StudentName = workRequest.StudentName,
                        Theme = workRequest.Theme,
                        Supervisor = workRequest.Supervisor,
                        Consultant = workRequest.Consultant,
                        Reviewer = workRequest.Reviewer,
                        SupervisorMark = workRequest.SupervisorMark,
                        ReviewerMark = workRequest.ReviewerMark,
                        CodeLink = workRequest.CodeLink,
                    });
            }

            foreach (var name in request.Members)
            {
                meeting.Members?.Add(
                    new User
                    {
                        UserName = name,
                        PasswordHash = string.Empty,
                        RoleId = (int)RolesEnum.Member,
                    });
            }

            meeting.Criteria = await this.GetCriteria(request.CriteriaId);

            await meetingRepository.Update(meeting);
        }
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