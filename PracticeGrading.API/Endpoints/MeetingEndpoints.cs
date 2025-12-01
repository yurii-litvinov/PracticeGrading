// <copyright file="MeetingEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using Microsoft.AspNetCore.Mvc;
using PracticeGrading.API.Integrations;
using PracticeGrading.API.Integrations.ThesisUploader;
using PracticeGrading.API.Integrations.XlsxGenerator;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using System.IO.Compression;
using System.Text.Json;

/// <summary>
/// Class for meeting endpoints.
/// </summary>
public static class MeetingEndpoints
{
    /// <summary>
    /// Registers meeting endpoints.
    /// </summary>
    /// <param name="app">The endpoint route builder to which meeting endpoints will be mapped.</param>
    public static void MapMeetingEndpoints(this IEndpointRouteBuilder app)
    {
        var meetingGroup = app.MapGroup("/meetings");

        meetingGroup.MapPost("/new", CreateMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapPut("/update", UpdateMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapDelete("/delete", DeleteMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapPost("/fromFile", CreateMeetingsFromFile).RequireAuthorization("RequireAdminRole")
            .DisableAntiforgery();
        meetingGroup.MapPost("/uploadTheses", UploadTheses).RequireAuthorization("RequireAdminRole")
            .DisableAntiforgery();
        meetingGroup.MapGet("/getMarkTable", GetMarkTable).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapGet("/getMarkTableForStudents", GetMarkTableForStudents).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapGet("/getDocuments", GetDocuments).RequireAuthorization("RequireAdminRole");

        meetingGroup.MapGet(string.Empty, GetMeeting).RequireAuthorization("RequireAdminOrMemberRole");
        meetingGroup.MapPut("/setMark", SetFinalMark).RequireAuthorization("RequireAdminOrMemberRole");

        meetingGroup.MapGet("/members", GetMembers).AllowAnonymous();
    }

    private static async Task<IResult> CreateMeeting(MeetingRequest request, MeetingService meetingService)
    {
        await meetingService.AddMeeting(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetMeeting(int? id, MeetingService meetingService)
    {
        var meetings = await meetingService.GetMeeting(id);
        return Results.Ok(meetings);
    }

    private static async Task<IResult> UpdateMeeting(MeetingRequest request, MeetingService meetingService)
    {
        await meetingService.UpdateMeeting(request);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteMeeting(int id, MeetingService meetingService)
    {
        await meetingService.DeleteMeeting(id);
        return Results.Ok();
    }

    private static async Task<IResult> GetMembers(int id, MeetingService meetingService)
    {
        var members = await meetingService.GetMembers(id);
        return Results.Ok(members);
    }

    private static async Task<IResult> SetFinalMark(
        int meetingId,
        int workId,
        string mark,
        MeetingService meetingService)
    {
        await meetingService.SetFinalMark(meetingId, workId, mark);
        return Results.Ok();
    }

    private static async Task<IResult> CreateMeetingsFromFile(
        [FromForm] ParseScheduleRequest request,
        MeetingService meetingService)
    {
        await meetingService.CreateMeetingsFromFile(request);
        return Results.Ok();
    }

    private static async Task<IResult> UploadTheses(
        [FromForm] IFormFileCollection fileCollection,
        [FromForm] string thesisInfosString)
    {
        var files = new Dictionary<string, StreamContent>();
        foreach (var file in fileCollection)
        {
            var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var fileContent = new StreamContent(memoryStream);
            fileContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

            files[file.FileName] = fileContent;
        }

        var thesisInfos = JsonSerializer.Deserialize<List<ThesisInfo>>(thesisInfosString) ?? [];

        var uploader = new ThesisUploader(files, thesisInfos);
        var uploaded = await uploader.Upload();

        return Results.Ok(uploaded);
    }

    private static async Task<IResult> GetMarkTable(int id, MeetingService meetingService, MarkService markService)
    {
        var meetings = await meetingService.GetMeeting(id);
        var meeting = meetings.First();
        var memberMarks = await markService.GetMemberMarks();

        var table = new MarkTableGenerator().Generate(meeting, memberMarks);

        return Results.File(table, "application/octet-stream", "table.xlsx");
    }

    private static async Task<IResult> GetMarkTableForStudents(int id, MeetingService meetingService)
    {
        var meetings = await meetingService.GetMeeting(id);
        var meeting = meetings.First();

        var table = new MarkTableGenerator().GenerateForStudents(meeting);

        return Results.File(table, "application/octet-stream", "table.xlsx");
    }

    private static async Task<IResult> GetDocuments(
        int id,
        string coordinator,
        string chairman,
        MeetingService meetingService)
    {
        var meetings = await meetingService.GetMeeting(id);
        var meeting = meetings.First();

        var allDocuments = await GenerateAllDocumentsParallelAsync(meeting, coordinator, chairman);
        var zipStream = new MemoryStream();

        using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (file, fileName) in allDocuments)
            {
                var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
                using var entryStream = entry.Open();

                using var memoryStream = new MemoryStream();
                file.CopyTo(memoryStream);
                memoryStream.Position = 0;
                memoryStream.CopyTo(entryStream);

                file.Dispose();
            }
        }

        zipStream.Position = 0;

        return Results.File(zipStream, "application/zip", "documents.zip");
    }

    private static async Task<List<(Stream File, string FileName)>> GenerateAllDocumentsParallelAsync(
    MeetingDto meeting, string coordinator, string chairman)
    {
        var generator = new DocumentsGenerator(meeting);

        var statementTemplate = new MemoryStream(File.ReadAllBytes(Path.Combine("Integrations", "Templates", "statement_template.docx")));

        var tasks = new List<Task<(Stream, string)>>
        {
        Task.Run(() => generator.GenerateStatement(coordinator, chairman, statementTemplate)),
        };

        byte[] gradingTemplateBytes = await File.ReadAllBytesAsync(Path.Combine("Integrations", "Templates", "grading_sheet_template.docx"));
        byte[] agreementTemplateBytes = await File.ReadAllBytesAsync(Path.Combine("Integrations", "Templates", "agreement_template.docx"));

        foreach (var member in meeting.Members)
        {
            var gradingTemplate = new MemoryStream(gradingTemplateBytes);
            var agreementTemplate = new MemoryStream(agreementTemplateBytes);
            tasks.Add(Task.Run(() => generator.GenerateGradingSheet(member.Name, gradingTemplate)));
            tasks.Add(Task.Run(() => generator.GenerateAgreement(member.Name, agreementTemplate)));
        }

        var results = await Task.WhenAll(tasks);

        return results.ToList();
    }
}