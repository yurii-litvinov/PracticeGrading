// <copyright file="ChangePasswordResult.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Result of a password change attempt.
/// </summary>
public enum ChangePasswordResult
{
    /// <summary>
    /// The password was changed successfully.
    /// </summary>
    Success,

    /// <summary>
    /// The user was not found.
    /// </summary>
    UserNotFound,

    /// <summary>
    /// The current password is incorrect.
    /// </summary>
    InvalidCurrentPassword,

    /// <summary>
    /// The new password does not meet the requirements.
    /// </summary>
    InvalidNewPassword,
}