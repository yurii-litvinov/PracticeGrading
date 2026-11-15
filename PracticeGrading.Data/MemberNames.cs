// <copyright file="MemberNames.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data;

/// <summary>
/// Provides consistent commission member name matching.
/// </summary>
public static class MemberNames
{
    /// <summary>
    /// Removes repeated whitespace while preserving the spelling of the name.
    /// </summary>
    /// <param name="name">Member name.</param>
    /// <returns>The name with single spaces between words.</returns>
    public static string Clean(string name) =>
        string.Join(" ", name.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    /// <summary>
    /// Produces a case-insensitive name for matching and creation locks.
    /// </summary>
    /// <param name="name">Member name.</param>
    /// <returns>The normalized name.</returns>
    public static string Normalize(string name) => Clean(name).ToLowerInvariant();
}
