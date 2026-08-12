// <copyright file="ActiveMemberAccessHandler.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Auth;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using PracticeGrading.API.Models;
using PracticeGrading.API.Repositories;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Verifies that a commission member's access has not been revoked.
/// </summary>
/// <param name="meetingMemberAccessRepository">
/// Repository for meeting-specific member accesses.
/// </param>
/// <param name="trustedMemberAccessRepository">
/// Repository for trusted member accesses.
/// </param>
public sealed class ActiveMemberAccessHandler(
    MeetingMemberAccessRepository meetingMemberAccessRepository,
    TrustedMemberAccessRepository trustedMemberAccessRepository)
    : AuthorizationHandler<ActiveMemberAccessRequirement>
{
    /// <inheritdoc/>
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveMemberAccessRequirement requirement)
    {
        if (context.User.IsInRole(
            RolesEnum.Admin.ToString().ToLowerInvariant()))
        {
            context.Succeed(requirement);
            return;
        }

        if (!context.User.IsInRole(
                RolesEnum.Member.ToString().ToLowerInvariant()) ||
            !TryGetIntClaim(
                context.User,
                ClaimTypes.NameIdentifier,
                out var memberId) ||
            !TryGetIntClaim(
                context.User,
                CustomClaimTypes.MeetingId,
                out var meetingId))
        {
            return;
        }

        var meetingAccessIdClaim =
            context.User.FindFirstValue(
                CustomClaimTypes.MeetingAccessId);

        var trustedAccessIdClaim =
            context.User.FindFirstValue(
                CustomClaimTypes.TrustedAccessId);

        bool isActive;

        if (int.TryParse(
                meetingAccessIdClaim,
                out var meetingAccessId))
        {
            isActive =
                await meetingMemberAccessRepository.IsActive(
                    meetingAccessId,
                    memberId,
                    meetingId);
        }
        else if (int.TryParse(
                     trustedAccessIdClaim,
                     out var trustedAccessId))
        {
            isActive =
                await trustedMemberAccessRepository.IsActive(
                    trustedAccessId,
                    memberId);
        }
        else
        {
            return;
        }

        if (isActive)
        {
            context.Succeed(requirement);
        }
    }

    private static bool TryGetIntClaim(
        ClaimsPrincipal user,
        string claimType,
        out int value)
    {
        var claimValue =
            user.FindFirstValue(claimType);

        return int.TryParse(claimValue, out value);
    }
}