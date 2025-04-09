// <copyright file="ThesisInfo.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations.ThesisUploader;

using System.Text.Json.Serialization;

/// <summary>
/// Information about the student work to be uploaded to the SP Department website.
/// </summary>
public class ThesisInfo
{
    /// <summary>
    /// Gets or sets type of the work.
    /// </summary>
    [JsonPropertyName("type_id")]
    public int TypeId { get; set; }

    /// <summary>
    /// Gets or sets student course.
    /// </summary>
    [JsonPropertyName("course_id")]
    public int CourseId { get; set; }

    /// <summary>
    /// Gets or sets theme name.
    /// </summary>
    [JsonPropertyName("name_ru")]
    public required string NameRu { get; set; }

    /// <summary>
    /// Gets or sets author name.
    /// </summary>
    [JsonPropertyName("author")]
    public required string Author { get; set; }

    /// <summary>
    /// Gets or sets code link.
    /// </summary>
    [JsonPropertyName("source_uri")]
    public required string SourceUri { get; set; }

    /// <summary>
    /// Gets or sets supervisor's last name.
    /// </summary>
    [JsonPropertyName("supervisor")]
    public required string Supervisor { get; set; }

    /// <summary>
    /// Gets or sets publish year.
    /// </summary>
    [JsonPropertyName("publish_year")]
    public int PublishYear { get; set; }

    /// <summary>
    /// Gets or sets secret key.
    /// </summary>
    [JsonPropertyName("secret_key")]
    public required string SecretKey { get; set; }
}