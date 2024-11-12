// <copyright file="JwtOptions.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API;

/// <summary>
/// Class for JWT options.
/// </summary>
public class JwtOptions
{
    /// <summary>
    /// Gets or sets issuer.
    /// </summary>
    public string Issuer { get; set; }

    /// <summary>
    /// Gets or sets audience.
    /// </summary>
    public string Audience { get; set; }

    /// <summary>
    /// Gets or sets token expiration.
    /// </summary>
    public TimeSpan Expires { get; set; }

    /// <summary>
    /// Gets or sets secret key.
    /// </summary>
    public string SecretKey { get; set; }
}