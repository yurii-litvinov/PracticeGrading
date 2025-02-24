// <copyright file="ThesisUploader.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations;

using System.Text;
using System.Text.Json;
using PracticeGrading.API.Models;

/// <summary>
/// Class for uploading student works to the SP Department website.
/// </summary>
public class ThesisUploader
{
    private const string Url = "https://se.math.spbu.ru/post_theses";
    private static readonly List<string> Keys = ["thesis_text", "reviewer_review", "presentation", "supervisor_review"];

    private readonly Dictionary<string, StreamContent> files;
    private readonly Dictionary<ThesisInfo, Dictionary<string, string>> works = new();
    private readonly List<ThesisInfo> thesisInfos;

    /// <summary>
    /// Initializes a new instance of the <see cref="ThesisUploader"/> class.
    /// </summary>
    /// <param name="files">Files with their names.</param>
    /// <param name="thesisInfos">List of the <see cref="ThesisInfo"/> instances.</param>
    public ThesisUploader(Dictionary<string, StreamContent> files, List<ThesisInfo> thesisInfos)
    {
        this.files = files;
        this.thesisInfos = thesisInfos;

        foreach (var thesisInfo in this.thesisInfos)
        {
            ProcessThesisInfo(thesisInfo);
            this.works.Add(thesisInfo, new Dictionary<string, string>());
            this.FetchStudentFiles(thesisInfo);
        }
    }

    /// <summary>
    /// Uploads student works to the SP Department website.
    /// </summary>
    /// <returns>List of student names whose works have been successfully uploaded.</returns>
    public async Task<List<string>> Upload()
    {
        var uploaded = new List<string>();
        using var client = new HttpClient();

        foreach (var thesisInfo in this.thesisInfos)
        {
            using var form = new MultipartFormDataContent();

            foreach (var key in Keys)
            {
                this.AddFileToForm(form, this.works[thesisInfo], key);
            }

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(thesisInfo),
                Encoding.UTF8,
                "application/json");
            form.Add(jsonContent, "thesis_info", "thesis_info");

            var response = await client.PostAsync(Url, form);

            if (response.IsSuccessStatusCode)
            {
                uploaded.Add(thesisInfo.Author);
            }
        }

        return uploaded;
    }

    private static void ProcessThesisInfo(ThesisInfo thesisInfo)
    {
        thesisInfo.Supervisor = thesisInfo.Supervisor.Split(' ')[0];
        thesisInfo.SourceUri =
            thesisInfo.SourceUri is "NDA" or null ? string.Empty : thesisInfo.SourceUri.Split(' ')[0];
    }

    private static string Transliterate(string cyrillic)
    {
        var transliterationMap = new Dictionary<char, string>
        {
            { 'А', "A" }, { 'Б', "B" }, { 'В', "V" }, { 'Г', "G" }, { 'Д', "D" },
            { 'Е', "E" }, { 'Ё', "Yo" }, { 'Ж', "Zh" }, { 'З', "Z" }, { 'И', "I" },
            { 'Й', "I" }, { 'К', "K" }, { 'Л', "L" }, { 'М', "M" }, { 'Н', "N" },
            { 'О', "O" }, { 'П', "P" }, { 'Р', "R" }, { 'С', "S" }, { 'Т', "T" },
            { 'У', "U" }, { 'Ф', "F" }, { 'Х', "Kh" }, { 'Ц', "Ts" }, { 'Ч', "Ch" },
            { 'Ш', "Sh" }, { 'Щ', "Shch" }, { 'Ъ', string.Empty }, { 'Ы', "Y" }, { 'Ь', string.Empty },
            { 'Э', "E" }, { 'Ю', "Yu" }, { 'Я', "Ya" },
            { 'а', "a" }, { 'б', "b" }, { 'в', "v" }, { 'г', "g" }, { 'д', "d" },
            { 'е', "e" }, { 'ё', "yo" }, { 'ж', "zh" }, { 'з', "z" }, { 'и', "i" },
            { 'й', "i" }, { 'к', "k" }, { 'л', "l" }, { 'м', "m" }, { 'н', "n" },
            { 'о', "o" }, { 'п', "p" }, { 'р', "r" }, { 'с', "s" }, { 'т', "t" },
            { 'у', "u" }, { 'ф', "f" }, { 'х', "kh" }, { 'ц', "ts" }, { 'ч', "ch" },
            { 'ш', "sh" }, { 'щ', "shch" }, { 'ъ', string.Empty }, { 'ы', "y" }, { 'ь', string.Empty },
            { 'э', "e" }, { 'ю', "yu" }, { 'я', "ya" },
        };

        var result = new StringBuilder();

        foreach (var key in cyrillic)
        {
            if (transliterationMap.TryGetValue(key, out var value))
            {
                result.Append(value);
            }
            else
            {
                result.Append(key);
            }
        }

        return result.ToString();
    }

    private void AddFileToForm(MultipartFormDataContent form, Dictionary<string, string> fileNames, string key)
    {
        if (!fileNames.TryGetValue(key, out var fileName))
        {
            return;
        }

        var fileContent = this.files[fileName];
        form.Add(fileContent, key, fileName);
    }

    private void FetchStudentFiles(ThesisInfo thesisInfo)
    {
        var nameSplit = thesisInfo.Author.Split(" ");
        var surname = nameSplit[0];
        var name = nameSplit[1];

        var fileNames = this.files.Keys
            .Where(
                fileName =>
                    fileName.StartsWith($"{surname}-") ||
                    fileName.StartsWith($"{surname}.{name}-") ||
                    fileName.StartsWith(Transliterate($"{surname}-")) ||
                    fileName.StartsWith(Transliterate($"{surname}.{name}-")))
            .ToList();

        foreach (var fileName in fileNames)
        {
            this.VerifyStudentFile(thesisInfo, fileName);
        }
    }

    private void VerifyStudentFile(ThesisInfo thesisInfo, string fileName)
    {
        if (fileName[^4..] != ".pdf")
        {
            return;
        }

        var index = fileName.IndexOf('-');
        if (index == -1)
        {
            return;
        }

        var fileType = fileName.Substring(index + 1, fileName.Length - 5 - index);
        var keyType = fileType switch
        {
            "отчёт" or "отче\u0308т" or "report" => "thesis_text",
            "презентация" or "presentation" => "presentation",
            "отзыв" or "review" or "advisor-review" => "supervisor_review",
            "отзыв-консультанта" or "consultant-review" or "рецензия" or "reviewer-review" => "reviewer_review",
            _ => null,
        };

        if (keyType != null)
        {
            this.works[thesisInfo][keyType] = fileName;
        }
    }
}