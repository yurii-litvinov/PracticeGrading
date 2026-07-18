// <copyright file="CreateAdminResult.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

/// <summary>
/// Result of an administrator creation attempt.
/// </summary>
public enum CreateAdminResult
{
    /// <summary>
    /// The administrator was created successfully.
    /// </summary>
    Success,

    /// <summary>
    /// The administrator performing the operation was not found.
    /// </summary>
    CurrentAdminNotFound,

    /// <summary>
    /// The current administrator password is incorrect.
    /// </summary>
    InvalidCurrentPassword,

    /// <summary>
    /// The username of the new administrator is invalid.
    /// </summary>
    InvalidUserName,

    /// <summary>
    /// The password of the new administrator does not meet the requirements.
    /// </summary>
    InvalidNewAdminPassword,

    /// <summary>
    /// A user with the specified username already exists.
    /// </summary>
    UserNameAlreadyExists,
}