// <copyright file="MeetingMemberAccessService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using Microsoft.EntityFrameworkCore;
using Npgsql;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Repositories;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Manages access requests for commission members within meetings.
/// </summary>
/// <param name="meetingMemberAccessRepository">
/// Repository for meeting access requests.
/// </param>
/// <param name="meetingRepository">
/// Repository for meetings.
/// </param>
/// <param name="userRepository">
/// Repository for users.
/// </param>
/// <param name="accessTokenService">
/// Service for generating and hashing access tokens.
/// </param>
public class MeetingMemberAccessService(
    MeetingMemberAccessRepository meetingMemberAccessRepository,
    MeetingRepository meetingRepository,
    UserRepository userRepository,
    AccessTokenService accessTokenService,
    JwtService jwtService)
{
    /// <summary>
    /// Creates a pending meeting access request.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="memberId">Commission member identifier.</param>
    /// <param name="userName">Commission member username.</param>
    /// <returns>
    /// The operation result and the generated raw access token.
    /// The token is returned only when the operation succeeds.
    /// </returns>
    public async Task<(
    CreateMeetingMemberAccessResult Result,
    string? Token)> CreateRequest(
        int meetingId,
        int memberId,
        string? userName)
    {
        var meeting =
            await meetingRepository.GetById(meetingId);

        if (meeting is null)
        {
            return (
                CreateMeetingMemberAccessResult.MeetingNotFound,
                null);
        }

        int resolvedMemberId;

        if (memberId != 0)
        {
            var member = await userRepository.GetUserById(memberId);

            if (member is null)
            {
                return (
                    CreateMeetingMemberAccessResult.MemberNotFound,
                    null);
            }

            if (member.RoleId != (int)RolesEnum.Member)
            {
                return (
                    CreateMeetingMemberAccessResult.InvalidMember,
                    null);
            }

            resolvedMemberId = member.Id;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(userName))
            {
                return (
                    CreateMeetingMemberAccessResult.InvalidMemberName,
                    null);
            }

            resolvedMemberId = await userRepository.Create(
                new User
                {
                    UserName = userName.Trim(),
                    RoleId = (int)RolesEnum.Member,
                });
        }

        var token = accessTokenService.GenerateToken();

        var access = new MeetingMemberAccess
        {
            MeetingId = meetingId,
            MemberId = resolvedMemberId,
            TokenHash = accessTokenService.HashToken(token),
            Status = MeetingMemberAccessStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        await meetingMemberAccessRepository.Create(access);

        return (
            CreateMeetingMemberAccessResult.Success,
            token);
    }

    /// <summary>
    /// Returns the current state of a meeting access request.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="token">Raw access token.</param>
    /// <returns>
    /// Access request information, or <see langword="null"/> if the token
    /// is invalid or belongs to another meeting.
    /// </returns>
    public async Task<MeetingMemberAccessStatusDto?> GetStatus(
        int meetingId,
        string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = accessTokenService.HashToken(token);
        var access = await meetingMemberAccessRepository.GetByTokenHash(tokenHash);

        if (access is null || access.MeetingId != meetingId)
        {
            return null;
        }

        return new MeetingMemberAccessStatusDto(
            MeetingId: access.MeetingId,
            MemberId: access.MemberId,
            MemberName: access.Member!.UserName,
            Status: access.Status,
            CreatedAt: access.CreatedAt,
            StatusChangedAt: access.StatusChangedAt);
    }

    /// <summary>
    /// Returns pending access requests for a meeting.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <returns>A collection of pending access requests.</returns>
    public async Task<List<PendingMeetingMemberAccessDto>>
        GetPendingRequests(int meetingId)
    {
        var accesses =
            await meetingMemberAccessRepository.GetPendingByMeetingId(meetingId);

        return [.. accesses
                .Select(access => new PendingMeetingMemberAccessDto(
                    Id: access.Id,
                    MemberId: access.MemberId,
                    MemberName: access.Member!.UserName,
                    CreatedAt: access.CreatedAt))];
    }

    /// <summary>
    /// Approves a pending meeting access request.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="accessId">Access request identifier.</param>
    /// <param name="changedByUserId">
    /// Identifier of the user approving the request.
    /// </param>
    /// <returns>The request processing result.</returns>
    public Task<ProcessMeetingMemberAccessResult> ApproveRequest(
        int meetingId,
        int accessId,
        int changedByUserId) =>
            this.ChangeStatus(
                meetingId,
                accessId,
                changedByUserId,
                MeetingMemberAccessStatus.Approved);

    /// <summary>
    /// Rejects a pending meeting access request.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="accessId">Access request identifier.</param>
    /// <param name="changedByUserId">
    /// Identifier of the user rejecting the request.
    /// </param>
    /// <returns>The request processing result.</returns>
    public Task<ProcessMeetingMemberAccessResult> RejectRequest(
        int meetingId,
        int accessId,
        int changedByUserId) =>
            this.ChangeStatus(
                meetingId,
                accessId,
                changedByUserId,
                MeetingMemberAccessStatus.Rejected);

    /// <summary>
    /// Authenticates a commission member using an approved meeting access token.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="token">Raw meeting access token.</param>
    /// <returns>
    /// A JWT for the specified meeting, or <see langword="null"/> if the
    /// access token is invalid or has not been approved.
    /// </returns>
    public async Task<string?> LoginApprovedMember(
        int meetingId,
        string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = accessTokenService.HashToken(token);
        var access = await meetingMemberAccessRepository.GetByTokenHash(tokenHash);

        if (access is null ||
            access.MeetingId != meetingId ||
            access.Status != MeetingMemberAccessStatus.Approved ||
            access.Member is null)
        {
            return null;
        }

        return jwtService.GenerateToken(
            access.Member!,
            meetingId: meetingId,
            meetingAccessId: access.Id);
    }

    /// <summary>
    /// Returns approved accesses for the specified meeting.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <returns>Approved meeting accesses.</returns>
    public async Task<List<ApprovedMeetingMemberAccessDto>>
        GetApprovedAccesses(int meetingId)
    {
        var accesses =
            await meetingMemberAccessRepository
                .GetApprovedByMeetingId(meetingId);

        return
        [
            .. accesses.Select(
            access =>
                new ApprovedMeetingMemberAccessDto(
                    access.Id,
                    access.MemberId,
                    access.Member?.UserName ?? string.Empty,
                    access.CreatedAt,
                    access.StatusChangedAt))
        ];
    }

    /// <summary>
    /// Revokes an approved meeting access.
    /// </summary>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <param name="accessId">Access identifier.</param>
    /// <param name="statusChangedByUserId">
    /// Identifier of the administrator revoking access.
    /// </param>
    /// <returns>Access processing result.</returns>
    public async Task<ProcessMeetingMemberAccessResult>
        RevokeRequest(
            int meetingId,
            int accessId,
            int statusChangedByUserId)
    {
        var access =
            await meetingMemberAccessRepository
                .GetById(accessId);

        if (access is null ||
            access.MeetingId != meetingId)
        {
            return ProcessMeetingMemberAccessResult
                .AccessNotFound;
        }

        if (access.Status !=
            MeetingMemberAccessStatus.Approved)
        {
            return ProcessMeetingMemberAccessResult
                .AlreadyProcessed;
        }

        access.Status =
            MeetingMemberAccessStatus.Revoked;

        access.StatusChangedAt = DateTime.UtcNow;

        access.StatusChangedByUserId =
            statusChangedByUserId;

        return await this.SaveStatusChange();
    }

    private static bool IsDuplicateMeetingMember(
        DbUpdateException exception)
    {
        return exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: "PK_MeetingUser",
        };
    }

    private async Task<ProcessMeetingMemberAccessResult> ChangeStatus(
        int meetingId,
        int accessId,
        int changedByUserId,
        MeetingMemberAccessStatus newStatus)
    {
        var access = await meetingMemberAccessRepository.GetById(accessId);

        if (access is null || access.MeetingId != meetingId)
        {
            return ProcessMeetingMemberAccessResult.AccessNotFound;
        }

        if (access.Status != MeetingMemberAccessStatus.Pending)
        {
            return ProcessMeetingMemberAccessResult.AlreadyProcessed;
        }

        if (newStatus == MeetingMemberAccessStatus.Approved)
        {
            var meeting =
                await meetingRepository.GetById(meetingId);

            if (meeting is null)
            {
                return ProcessMeetingMemberAccessResult.AccessNotFound;
            }

            if (meeting.Members.All(member =>
                member.Id != access.MemberId))
            {
                meeting.Members.Add(access.Member!);
            }
        }

        access.Status = newStatus;
        access.StatusChangedAt = DateTime.UtcNow;
        access.StatusChangedByUserId = changedByUserId;

        return await this.SaveStatusChange();
    }

    private async Task<ProcessMeetingMemberAccessResult>
        SaveStatusChange()
    {
        try
        {
            await meetingMemberAccessRepository.SaveChanges();

            return ProcessMeetingMemberAccessResult.Success;
        }
        catch (DbUpdateConcurrencyException)
        {
            return ProcessMeetingMemberAccessResult.AlreadyProcessed;
        }
        catch (DbUpdateException exception)
            when (IsDuplicateMeetingMember(exception))
        {
            return ProcessMeetingMemberAccessResult.AlreadyProcessed;
        }
    }
}
