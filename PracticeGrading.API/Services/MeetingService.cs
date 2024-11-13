// <copyright file="MeetingService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using Models;
using System.Diagnostics.CodeAnalysis;
using Data.Entities;
using Data.Repositories;

/// <summary>
/// Service for working with meetings.
/// </summary>
/// <param name="meetingRepository">Repository for meetings.</param>
[SuppressMessage(
    "StyleCop.CSharp.SpacingRules",
    "SA1010:Opening square brackets should be spaced correctly",
    Justification = "Causes another problem with spaces")]
public class MeetingService(MeetingRepository meetingRepository)
{
    /// <summary>
    /// Adds new meeting.
    /// </summary>
    /// <param name="request">Meeting creation request.</param>
    public async Task AddMeeting(CreateMeetingRequest request)
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
                name => new Member
                {
                    UserName = name,
                    PasswordHash = string.Empty,
                    RoleId = (int)RolesEnum.Member,
                }).ToList(),
        };

        await meetingRepository.Create(meeting);
    }

    /// <summary>
    /// Gets meeting by id or all meetings.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    /// <returns>List of meetings.</returns>
    public async Task<List<Meeting>> GetMeeting(int? id = null)
    {
        if (id == null)
        {
            return await meetingRepository.GetAll();
        }

        return [await meetingRepository.GetById(id.Value) ?? throw new Exception()];
    }

    /// <summary>
    /// Deletes meeting.
    /// </summary>
    /// <param name="id">Meeting id.</param>
    public async Task DeleteMeeting(int id)
    {
        var meeting = await meetingRepository.GetById(id);
        if (meeting == null)
        {
            throw new Exception();
        }

        await meetingRepository.Delete(meeting);
    }
}