// <copyright file="ChangePasswordRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Request for changing the current user's password.
/// </summary>
/// <param name="CurrentPassword">Current password.</param>
/// <param name="NewPassword">New password.</param>
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);