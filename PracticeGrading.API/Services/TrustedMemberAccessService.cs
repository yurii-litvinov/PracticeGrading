// <copyright file="TrustedMemberAccessService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Provides operations for issuing, validating,
/// and revoking trusted member access.
/// </summary>
/// <param name="accessRepository">
/// Repository for trusted member accesses.
/// </param>
/// <param name="userRepository">
/// Repository for users.
/// </param>
/// <param name="meetingRepository">Repository for meetings.</param>
/// <param name="jwtService">Service for generating JWT tokens.</param
public class TrustedMemberAccessService(
    TrustedMemberAccessRepository accessRepository,
    UserRepository userRepository,
    MeetingRepository meetingRepository,
    AccessTokenService accessTokenService,
    JwtService jwtService)
{
    private const int TokenSizeInBytes = 32;

    /// <summary>
    /// Issues or replaces permanent trusted access
    /// for the specified commission member.
    /// </summary>
    /// <param name="memberId">
    /// The identifier of the commission member.
    /// </param>
    /// <returns>
    /// The generated secret token. The token is returned in its
    /// original form only when it is issued.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the user does not exist or is not a commission member.
    /// </exception>
    public async Task<string> IssueAccess(int memberId)
    {
        var member = await userRepository.GetUserById(memberId)
            ?? throw new InvalidOperationException(
                $"User with id {memberId} was not found.");

        if (member.RoleId != (int)RolesEnum.Member)
        {
            throw new InvalidOperationException(
                $"User with id {memberId} is not a commission member.");
        }

        var token = accessTokenService.GenerateToken();
        var tokenHash = accessTokenService.HashToken(token);

        var access = await accessRepository.GetByMemberId(memberId);

        if (access is null)
        {
            access = new()
            {
                MemberId = memberId,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
            };

            await accessRepository.Create(access);
        }
        else
        {
            access.TokenHash = tokenHash;
            access.CreatedAt = DateTime.UtcNow;
            access.RevokedAt = null;

            await accessRepository.SaveChanges();
        }

        return token;
    }

    /// <summary>
    /// Revokes permanent trusted access issued to a member.
    /// </summary>
    /// <param name="memberId">
    /// The identifier of the commission member.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if active access was revoked;
    /// otherwise, <see langword="false"/>.
    /// </returns>
    public async Task<bool> RevokeAccess(int memberId)
    {
        var access = await accessRepository.GetByMemberId(memberId);

        if (access is null || access.RevokedAt is not null)
        {
            return false;
        }

        access.RevokedAt = DateTime.UtcNow;

        await accessRepository.SaveChanges();

        return true;
    }

    /// <summary>
    /// Gets the member authenticated by a trusted access token.
    /// </summary>
    /// <param name="token">
    /// The secret trusted access token presented by the client.
    /// </param>
    /// <returns>
    /// The authenticated member, or <see langword="null"/>
    /// if the token is invalid or revoked.
    /// </returns>
    public async Task<User?> GetMemberByToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = accessTokenService.HashToken(token);
        var access = await accessRepository
            .GetActiveByTokenHash(tokenHash);

        if (access?.Member is null ||
            access.Member.RoleId != (int)RolesEnum.Member)
        {
            return null;
        }

        return access.Member;
    }

    /// <summary>
    /// Gets the current trusted access status for a commission member.
    /// </summary>
    /// <param name="memberId">
    /// The identifier of the commission member.
    /// </param>
    /// <returns>
    /// The current trusted access status.
    /// </returns>
    public async Task<TrustedMemberAccessStatusDto> GetAccessStatus(int memberId)
    {
        var access = await accessRepository.GetByMemberId(memberId);

        if (access is null)
        {
            return new(
                IsIssued: false,
                IsActive: false,
                CreatedAt: null,
                RevokedAt: null);
        }

        return new(
            IsIssued: true,
            IsActive: access.RevokedAt is null,
            CreatedAt: access.CreatedAt,
            RevokedAt: access.RevokedAt);
    }

    /// <summary>
    /// Authenticates a trusted commission member for a meeting.
    /// </summary>
    /// <param name="meetingId">The meeting identifier.</param>
    /// <param name="trustedAccessToken">
    /// The permanent trusted access token.
    /// </param>
    /// <returns>
    /// A JWT token if trusted access is valid; otherwise, <see langword="null"/>.
    /// </returns>
    /// <exception cref="KeyNotFoundException">
    /// Thrown when the meeting does not exist.
    /// </exception>
    public async Task<string?> LoginTrustedMember(
        int meetingId,
        string? trustedAccessToken)
    {
        if (string.IsNullOrWhiteSpace(trustedAccessToken))
        {
            return null;
        }

        var trustedAccess =
            await this.GetAccessByToken(trustedAccessToken);

        if (trustedAccess?.Member is null)
        {
            return null;
        }

        var trustedMember = trustedAccess.Member;

        var meeting = await meetingRepository.GetById(meetingId)
            ?? throw new KeyNotFoundException(
                $"Meeting with ID {meetingId} was not found.");

        await meetingRepository.AddMemberIfMissing(
            meeting.Id,
            trustedMember.Id);

        return jwtService.GenerateToken(
            trustedMember,
            meetingId: meetingId,
            trustedAccessId: trustedAccess.Id);
    }

    private async Task<TrustedMemberAccess?> GetAccessByToken(
    string token)
    {
        var tokenHash = accessTokenService.HashToken(token);

        var trustedAccess =
            await accessRepository.GetActiveByTokenHash(tokenHash);

        if (trustedAccess is null ||
            trustedAccess.RevokedAt is not null)
        {
            return null;
        }

        return trustedAccess;
    }
}