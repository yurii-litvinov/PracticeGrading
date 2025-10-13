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
    private const int SheetTableSize = 5;
    private const int DateSpace = 45;
    private const int SignSpace = 30;

    private static readonly Dictionary<string, (string Number, string Name)> MajorDictionary = new()
    {
        { "5080", ("09.03.04", "Программная инженерия") },
        { "5162", ("02.03.03", "Технологии программирования") },
        { "5665", ("02.03.03", "Математическое обеспечение и администрирование информационных систем") },
        { "5890", ("09.03.03", "Искусственный интеллект и наука о данных") },
    };

    private readonly MeetingDto meeting;
    private readonly string commissionNumber;
    private readonly (string Number, string Name) major;
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
    /// <param name="coordinator">coordinator.</param>
    /// <param name="chairman">Chairman.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateStatement(string coordinator, string chairman)
    {
        var statementData = new Dictionary<string, string>
        {
            { "[number]", this.commissionNumber },
            { "[major]", $"{this.major.Number} «{this.major.Name}»" },
            { "[date]", this.date },
            {
                "[members]",
                string.Join(
                    "\n",
                    this.meeting.Members.Select((member, index) => $"{index + 1}. {member.Name}"))
            },
            { "[coordinator]", coordinator },
            { "[chairman]", chairman },
        };

        using var stream = new FileStream(
            Path.Combine("Integrations", "Templates", "statement_template.docx"),
            FileMode.Open);
        var doc = new XWPFDocument(stream);

        foreach (var placeHolder in statementData)
        {
            ReplacePlaceHolderInTables(doc, placeHolder.Key, placeHolder.Value);
        }

        var table = doc.Tables[4];
        CreateStatementTableHeader(table, this.meeting.Members.Count);
        this.FillStatementStudentTable(table, this.meeting.Members.Count);

        table.GetCTTbl().tblPr.AddNewTblLayout().type = ST_TblLayoutType.autofit;
        table.GetCTTbl().tblPr.AddNewTblW().type = ST_TblWidth.pct;
        table.GetCTTbl().tblPr.tblW.w = "100%";

        var commisionTable = doc.Tables[5];
        this.FillСommissionMembers(commisionTable, chairman);

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
            { "[member_initials]", GetSurnameWithInitials(member) },
            { "[member]", member },
            { "[number]", this.commissionNumber },
            { "[major]", $"{this.major.Number} «{this.major.Name}»" },
            { "[date]", this.date },
            { "[member_sign]", member + string.Concat(Enumerable.Repeat(" ", int.Max(SignSpace - member.Length, 0))) },
        };

        using var stream = new FileStream(
            Path.Combine("Integrations", "Templates", "grading_sheet_template.docx"),
            FileMode.Open);
        var doc = new XWPFDocument(stream);

        foreach (var placeHolder in sheetData)
        {
            ReplacePlaceHolderInTables(doc, placeHolder.Key, placeHolder.Value);
        }

        var table = doc.Tables[4];

        this.FillGradingSheetStudentTable(table);

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

    private static void CreateStatementTableHeader(XWPFTable table, int membersCount)
    {
        var firstRow = table.Rows[0];
        var secondRow = table.Rows[1];

        for (var i = 1; i <= membersCount; i++)
        {
            secondRow.GetCell(i).Paragraphs[0].Alignment = ParagraphAlignment.CENTER;
            var run = secondRow.GetCell(i).Paragraphs[0].CreateRun();
            SetFormattedTextToRun(run, i.ToString());
            run.IsBold = true;
            firstRow.CreateCell();
            secondRow.CreateCell();
        }

        MergeCellVertically(table, 0, 0, 1);
        MergeCellVertically(table, membersCount + 1, 0, 1);

        firstRow.GetCell(0).SetVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);

        var lastCell = firstRow.GetCell(membersCount + 1);
        lastCell.RemoveParagraph(0);
        lastCell.SetVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
        var paragraphs = new List<string> { "Итоговая", "оценка*" };

        foreach (var paragraph in paragraphs)
        {
            var finalRun = lastCell.AddParagraph().CreateRun();
            finalRun.Paragraph.Alignment = ParagraphAlignment.CENTER;
            SetFormattedTextToRun(finalRun, paragraph);
        }

        if (membersCount > 1)
        {
            firstRow.MergeCells(1, membersCount);
        }
    }

    private static void ReplacePlaceHolderInTables(XWPFDocument doc, string placeHolder, string replaceText)
    {
        foreach (var table in doc.Tables)
        {
            foreach (var row in table.Rows)
            {
                foreach (var cell in row.GetTableCells())
                {
                    foreach (var paragraph in cell.Paragraphs)
                    {
                        if (paragraph.Text.Contains(placeHolder))
                        {
                            paragraph.ReplaceText(placeHolder, replaceText);
                            return;
                        }
                    }
                }
            }
        }
    }

    private static void SetFormattedTextToRun(XWPFRun run, string text)
    {
        run.FontFamily = FontFamily;
        run.FontSize = FontSize;
        run.SetText(text);
    }

    private static string GetSurnameWithInitials(string fullName)
    {
        var nameSplit = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        if (nameSplit.Length != 3)
        {
            throw new ArgumentException(nameof(fullName));
        }

        return $"{nameSplit[0]} {nameSplit[1][0]}. {nameSplit[2][0]}.";
    }

    private (string CommissionNumber, (string Number, string Name) Major) ProcessMeetingInfo()
    {
        var info = this.meeting.Info;

        if (info == null || !info.Contains(Prefix))
        {
            throw new ArgumentException("Invalid meeting information.");
        }

        var startIndex = info.IndexOf(Prefix, StringComparison.Ordinal) + Prefix.Length;
        var number = info.Substring(startIndex, NumberLength);
        var name = MajorDictionary[number.Split('-')[0]];

        return (number, name);
    }

    private void FillGradingSheetStudentTable(XWPFTable table)
    {
        var studentList = this.meeting.StudentWorks.Select((work) => work.StudentName);
        int number = 1;

        foreach (var student in studentList)
        {
            var row = table.CreateRow();
            var numberRun = row.GetCell(0).Paragraphs[0].CreateRun();
            SetFormattedTextToRun(numberRun, number++.ToString());

            var studentNameRun = row.GetCell(1).Paragraphs[0].CreateRun();
            SetFormattedTextToRun(studentNameRun, student);

            row.CreateCell();
        }
    }

    private void FillStatementStudentTable(XWPFTable table, int membersCount)
    {
        var studentList = this.meeting.StudentWorks.Select((work) => work.StudentName);

        foreach (var student in studentList)
        {
            var row = table.CreateRow();
            var studentNameRun = row.GetCell(0).Paragraphs[0].CreateRun();
            SetFormattedTextToRun(studentNameRun, student);
            studentNameRun.IsBold = true;

            for (int i = 0; i < membersCount - 1; i++)
            {
                row.CreateCell();
            }
        }
    }

    private void FillСommissionMembers(XWPFTable commissionTable, string chairman)
    {
        var commissionMembers = new List<string>();
        commissionMembers.Add(chairman);
        commissionMembers.AddRange(this.meeting.Members.Select((member) => member.Name).Where((member) => member != chairman));

        int number = 1;

        foreach (var member in commissionMembers)
        {
            var run = commissionTable.CreateRow().GetCell(0).Paragraphs[0].CreateRun();
            SetFormattedTextToRun(run, $"{number++}. {member};");
        }
    }
}