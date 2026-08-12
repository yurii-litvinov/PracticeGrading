// <copyright file="CustomClaimTypes.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Auth;

/// <summary>
/// Contains custom JWT claim type names.
/// </summary>
public static class CustomClaimTypes
{
    /// <summary>
    /// Claim containing the identifier of the meeting
    /// to which the JWT grants access.
    /// </summary>
    public const string MeetingId = "meetingId";

    /// <summary>
    /// Claim containing the identifier of the approved
    /// meeting member access record.
    /// </summary>
    public const string MeetingAccessId = "meetingAccessId";

    /// <summary>
    /// Claim containing the identifier of the trusted
    /// member access record.
    /// </summary>
    public const string TrustedAccessId = "trustedAccessId";
}