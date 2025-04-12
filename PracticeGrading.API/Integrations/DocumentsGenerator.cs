// <copyright file="DocumentsGenerator.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations;

using System.Globalization;
using NPOI.OpenXmlFormats.Wordprocessing;
using NPOI.XWPF.UserModel;
using PracticeGrading.API.Models.DTOs;

/// <summary>
/// Class to generate meeting documents.
/// </summary>
public class DocumentsGenerator
{
    private const string Prefix = "ГЭК ";
    private const int NumberLength = 7;

    private const string FontFamily = "Times New Roman";
    private const int FontSize = 12;

    private const int StatementTableSize = 3;
    private const int SheetTableSize = 3;
    private const int DateSpace = 45;
    private const int SignSpace = 30;

    private static readonly Dictionary<string, string> MajorDictionary = new()
    {
        { "5080", "Программная инженерия" },
        { "5162", "Технологии программирования" },
        { "5665", "Математическое обеспечение и администрирование информационных систем" },
        { "5890", "Искусственный интеллект и наука о данных" },
    };

    private readonly MeetingDto meeting;
    private readonly string commissionNumber;
    private readonly string major;
    private readonly string date;

    /// <summary>
    /// Initializes a new instance of the <see cref="DocumentsGenerator"/> class.
    /// </summary>
    /// <param name="meeting">Meeting DTO.</param>
    public DocumentsGenerator(MeetingDto meeting)
    {
        this.meeting = meeting;
        (this.commissionNumber, this.major) = this.ProcessMeetingInfo();
        this.date = string.Format(CultureInfo.GetCultureInfo("ru-RU"), "{0:d MMMM yyyy} г.", this.meeting.DateAndTime);
    }

    /// <summary>
    /// Generates the statement document.
    /// </summary>
    /// <param name="coordinators">Coordinators.</param>
    /// <param name="chairman">Chairman.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateStatement(string coordinators, string chairman)
    {
        var statementData = new Dictionary<string, string>
        {
            { "[number]", this.commissionNumber },
            { "[major]", this.major },
            { "[date]", this.date },
            {
                "[members]",
                string.Join(
                    "\n",
                    this.meeting.Members.Where(member => member.Name != chairman)
                        .Select((member, index) => $"{index + 1}. {member.Name}"))
            },
            { "[coordinators]", coordinators },
            { "[chairman]", chairman },
        };

        using var stream = new FileStream(
            Path.Combine("Integrations", "Templates", "statement_template.docx"),
            FileMode.Open);
        var doc = new XWPFDocument(stream);

        foreach (var placeholder in statementData)
        {
            doc.Paragraphs.FirstOrDefault(paragraph => paragraph.Text.Contains(placeholder.Key))
                ?.ReplaceText(placeholder.Key, placeholder.Value);
        }

        var colCount = this.meeting.Members.Count + 1;
        var table = doc.Tables[0];

        CreateStatementTableHeader(table, colCount);
        this.FillStudentTable(table, colCount);

        table.GetCTTbl().tblPr.AddNewTblLayout().type = ST_TblLayoutType.autofit;
        table.GetCTTbl().tblPr.AddNewTblW().type = ST_TblWidth.pct;
        table.GetCTTbl().tblPr.tblW.w = "100%";

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;

        return (memoryStream, $"Ведомость ВКР ГЭК {this.commissionNumber}.docx");
    }

    /// <summary>
    /// Generates the grading sheet document.
    /// </summary>
    /// <param name="member">Member name.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateGradingSheet(string member)
    {
        var sheetData = new Dictionary<string, string>
        {
            { "[member]", member },
            { "[number]", this.commissionNumber },
            { "[major]", this.major },
            { "[date]", this.date + string.Concat(Enumerable.Repeat(" ", DateSpace - this.date.Length)) },
            { "[member_sign]", member + string.Concat(Enumerable.Repeat(" ", int.Max(SignSpace - member.Length, 0))) },
        };

        using var stream = new FileStream(
            Path.Combine("Integrations", "Templates", "grading_sheet_template.docx"),
            FileMode.Open);
        var doc = new XWPFDocument(stream);

        foreach (var placeholder in sheetData)
        {
            doc.Paragraphs.FirstOrDefault(paragraph => paragraph.Text.Contains(placeholder.Key))
                ?.ReplaceText(placeholder.Key, placeholder.Value);
        }

        var table = doc.Tables[0];

        this.FillStudentTable(table, SheetTableSize);

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;

        return (memoryStream, $"{member} оценочный лист ГЭК {this.commissionNumber}.docx");
    }

    private static void MergeCellVertically(XWPFTable table, int column, int start, int end)
    {
        for (var index = start; index <= end; index++)
        {
            var cell = table.GetRow(index).GetCell(column);
            cell.GetCTTc().AddNewTcPr().AddNewVMerge().val = index == start ? ST_Merge.restart : ST_Merge.@continue;
        }
    }

    private static void CreateStatementTableHeader(XWPFTable table, int colCount)
    {
        var firstRow = table.Rows[0];
        var secondRow = table.Rows[1];
        secondRow.RemoveCell(StatementTableSize - 1);

        for (var i = 1; i < colCount - 1; i++)
        {
            var run = secondRow.GetCell(i).Paragraphs[0].CreateRun();
            run.FontFamily = FontFamily;
            run.FontSize = FontSize;
            run.SetText(i.ToString());

            firstRow.CreateCell();
            secondRow.CreateCell();
        }

        firstRow.GetCell(colCount).RemoveParagraph(0);
        var paragraphs = new List<string> { "Итоговая", "оценка*" };

        foreach (var paragraph in paragraphs)
        {
            var finalRun = firstRow.GetCell(colCount).AddParagraph().CreateRun();
            finalRun.Paragraph.Alignment = ParagraphAlignment.CENTER;
            finalRun.FontFamily = FontFamily;
            finalRun.FontSize = FontSize;
            finalRun.SetText(paragraph);
        }

        firstRow.RemoveCell(StatementTableSize - 1);

        MergeCellVertically(table, 0, 0, 1);
        MergeCellVertically(table, colCount - 1, 0, 1);

        firstRow.MergeCells(1, colCount - 2);
    }

    private (string CommissionNumber, string Major) ProcessMeetingInfo()
    {
        var info = this.meeting.Info;

        if (info == null)
        {
            throw new ArgumentException("Invalid meeting information.");
        }

        var startIndex = info.IndexOf(Prefix, StringComparison.Ordinal) + Prefix.Length;
        var number = info.Substring(startIndex, NumberLength);
        var name = MajorDictionary[number.Split('-')[0]];

        return (number, name);
    }

    private void FillStudentTable(XWPFTable table, int colCount)
    {
        var studentList = this.meeting.StudentWorks.Select((work, index) => $"{index + 1}. {work.StudentName}");

        foreach (var student in studentList)
        {
            var row = table.CreateRow();
            var run = row.GetCell(0).Paragraphs[0].CreateRun();

            run.FontFamily = FontFamily;
            run.FontSize = FontSize;
            run.SetText(student);

            for (var i = StatementTableSize; i < colCount; i++)
            {
                row.CreateCell();
            }
        }
    }
}