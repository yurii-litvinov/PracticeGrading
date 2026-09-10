// <copyright file="ActiveMemberAccessRequirement.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Auth;

using Microsoft.AspNetCore.Authorization;

/// <summary>
/// Requires a commission member to have an active trusted
/// or meeting-specific access record.
/// </summary>
public sealed class ActiveMemberAccessRequirement
    : IAuthorizationRequirement
{
}