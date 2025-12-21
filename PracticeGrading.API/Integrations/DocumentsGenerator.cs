// <copyright file="DocumentsGenerator.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations;

using System.Globalization;
using System.Text.RegularExpressions;
using NPOI.OpenXmlFormats.Wordprocessing;
using NPOI.XWPF.UserModel;
using PracticeGrading.API.Models.DTOs;
using RussianTransliteration;

/// <summary>
/// Class to generate meeting documents.
/// </summary>
public class DocumentsGenerator
{
    private const string Prefix = "ГЭК ";
    private const int NumberLength = 7;

    private const string FontFamily = "Times New Roman";
    private const int FontSize = 12;

    private const int SignSpace = 30;

    private static readonly Dictionary<string, (string Major, string EducationalProgram, string AcademicDegree)> MajorInfoDictionary = new()
    {
        { "5080", ("09.03.04 «Программная инженерия»", "CB.5080.[year] «Программная инженерия»", "бакалавриат") },
        { "5162", ("02.03.03 «Математическое обеспечение и администрирование информационных систем»", "CB.5162.[year] «Технологии программирования»", "бакалавриат") },
        { "5665", ("02.04.03 «Математическое обеспечение и администрирование информационных систем»", "BM.5665.[year] «Математическое обеспечение и администрирование информационных систем»", "магистратура") },
        { "5666", ("09.04.04 «Программная инженерия»", "BM.5666.[year] «Программная инженерия»", "магистратура") },
        { "5001", ("02.03.01 «Математика и компьютерные науки»", "CB.5001.[year] «Математика и компьютерные науки»", "бакалавриат") },
        { "5212", ("09.03.03 «Прикладная информатика»", "CB.5212.[year] «Искусственный интеллект и наука о данных»", "бакалавриат") },
        { "5890", ("09.04.03 «Прикладная информатика»", "BM.5890.[year] «Искусственный интеллект и наука о данных»", "магистратура") },
    };

    private static readonly Dictionary<string, string> Degrees = new()
    {
        { "бакалавриат", "Бакалавр" },
        { "магистратура", "Магистр" },
    };

    private readonly MeetingDto meeting;
    private readonly string commissionNumber;
    private readonly string major;
    private readonly string educationalProgram;
    private readonly string academicDegree;
    private readonly string date;
    private readonly string time;
    private readonly MemberDto chairman;
    private readonly string chairmanOrder;
    private readonly string secretary;

    /// <summary>
    /// Initializes a new instance of the <see cref="DocumentsGenerator"/> class.
    /// </summary>
    /// <param name="meeting">Meeting DTO.</param>
    /// <param name="chairman">Chairman member DTO.</param>
    /// <param name="chairmanOrder">Chairman appointment order number.</param>
    /// <param name="secretary">Secretary's full name.</param>
    public DocumentsGenerator(MeetingDto meeting, MemberDto chairman, string chairmanOrder, string secretary)
    {
        this.meeting = meeting;
        (this.commissionNumber, this.major, this.educationalProgram, this.academicDegree) = this.ProcessMeetingInfo();
        this.date = string.Format(CultureInfo.GetCultureInfo("ru-RU"), "{0:d MMMM yyyy} г.", this.meeting.DateAndTime);
        this.time = this.meeting.DateAndTime.ToLocalTime().ToString("HH:mm");
        this.chairman = chairman;
        this.chairmanOrder = chairmanOrder;
        this.secretary = secretary;
    }

    /// <summary>
    /// Generates the statement document.
    /// </summary>
    /// <param name="coordinator">coordinator.</param>
    /// <param name="stream">Stream containing the agreement template document.
    /// The stream will be disposed after processing. Ensure the stream is readable and contains a valid DOCX template.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateStatement(string coordinator, Stream stream)
    {
        var statementData = new Dictionary<string, string>
        {
            { "[commission_number]", this.commissionNumber },
            { "[major]", this.major },
            { "[date]", this.date },
            { "[time]", this.time },
            {
                "[members]",
                string.Join(
                    "\n",
                    this.meeting.Members.Select((member, index) => $"{index + 1}. {member.Name}"))
            },
            { "[coordinator]", GetSurnameWithInitials(coordinator) },
            { "[chairman]", GetSurnameWithInitials(this.chairman.Name) },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInTables(doc, statementData);
        ReplacePlaceholdersInParagraphs(doc, statementData);

        var table = doc.Tables[2];
        CreateStatementTableHeader(table, this.meeting.Members.Count);
        this.FillStatementStudentTable(table, this.meeting.Members.Count);

        table.GetCTTbl().tblPr.AddNewTblLayout().type = ST_TblLayoutType.autofit;
        table.GetCTTbl().tblPr.AddNewTblW().type = ST_TblWidth.pct;
        table.GetCTTbl().tblPr.tblW.w = "100%";

        var commisionTable = doc.Tables[3];
        var members = new List<string> { this.chairman.Name };
        members.AddRange(this.meeting.Members.Where(m => m.Id != this.chairman.Id).Select(m => m.Name));
        GenerateMembersList(members, commisionTable.GetRow(0).GetCell(0));

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();
        return (memoryStream, $"Ведомость ВКР ГЭК {this.commissionNumber}.docx");
    }

    /// <summary>
    /// Generates the grading sheet document.
    /// </summary>
    /// <param name="member">Member name.</param>
    /// <param name="stream">Stream containing the grading sheet template document.
    /// The stream will be disposed after processing. Ensure the stream is readable and contains a valid DOCX template.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateGradingSheet(MemberDto member, Stream stream)
    {
        var sheetData = new Dictionary<string, string>
        {
            { "[member_initials]", GetSurnameWithInitials(member.Name) },
            { "[member]", member.Name },
            { "[number]", this.commissionNumber },
            { "[major]", this.major },
            { "[date]", this.date },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInTables(doc, sheetData);

        var table = doc.Tables[4];

        this.FillGradingSheetStudentTable(table);

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();

        return (memoryStream, $"{member.Name} оценочный лист ГЭК {this.commissionNumber}.docx");
    }

    /// <summary>
    /// Generates the agreement document.
    /// </summary>
    /// <param name="member">Member name.</param>
    /// <param name="stream">Stream containing the agreement template document.
    /// The stream will be disposed after processing. Ensure the stream is readable and contains a valid DOCX template.</param>
    /// <returns>File with its name.</returns>
    public (Stream File, string FileName) GenerateAgreement(MemberDto member, Stream stream)
    {
        var placeholders = new Dictionary<string, string>
        {
            { "[member]", member.Name },
            { "[member_initials]", GetSurnameWithInitials(member.Name) },
            { "[member_info_ru]", member.Name + ", " + (string.IsNullOrWhiteSpace(member.InformationRu) ? new string('_', 50) : member.InformationRu) },
            { "[member_info_en]", RussianTransliterator.GetTransliteration(member.Name) + ", " + (string.IsNullOrWhiteSpace(member.InformationEn) ? new string('_', 90) : member.InformationEn) },
            { "[email]", string.IsNullOrWhiteSpace(member.Email) ? new string('_', 25) : member.Email },
            { "[phone]", string.IsNullOrWhiteSpace(member.Phone) ? new string('_', 25) : member.Phone },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInParagraphs(doc, placeholders);
        ReplacePlaceholdersInTables(doc, placeholders);

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();

        return (memoryStream, $"{member.Name} Согласие на обработку персональных данных.docx");
    }

    /// <summary>
    /// Generates the chairman's report document based on a template.
    /// </summary>
    /// <param name="stream">Template document stream.</param>
    /// <returns>Generated report file and its name.</returns>
    public (Stream File, string FileName) GenerateChairmanReport(Stream stream)
    {
        var placeholders = new Dictionary<string, string>
        {
            { "[academic_degree]", this.academicDegree },
            { "[major]", this.major },
            { "[educational_program]", this.educationalProgram },
            { "[date]", this.date },
            { "[commission_number]", this.commissionNumber },
            { "[time]", this.time },
            { "[chairman_initials]", GetSurnameWithInitials(this.chairman.Name) },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInParagraphs(doc, placeholders);
        ReplacePlaceholdersInTables(doc, placeholders);

        var membersTable = doc.Tables[0];
        var cell = membersTable.Rows[0].GetCell(0);

        while (cell.Paragraphs.Count > 0)
        {
            cell.RemoveParagraph(0);
        }

        for (int i = 0; i < this.meeting.Members.Count; i++)
        {
            bool isChairman = this.meeting.Members[i] == this.chairman;
            this.GenerateMemberInfoText(cell, this.meeting.Members[i], $"2.{i + 1}", isChairman);
        }

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();

        return (memoryStream, $"Отчёт председателя ГЭК {this.commissionNumber}.docx");
    }

    /// <summary>
    /// Generates defense protocol document for a student's work.
    /// </summary>
    /// <param name="work">Student work information.</param>
    /// <param name="stream">Template document stream.</param>
    /// <returns>Generated protocol file and its name.</returns>
    public (Stream File, string FileName) GenerateDefenseProtocol(StudentWorkDto work, Stream stream)
    {
        var placeholders = new Dictionary<string, string>
        {
            { "[commission_number]", this.commissionNumber },
            { "[date]", this.date },
            { "[academic_degree]", this.academicDegree },
            { "[major]", this.major },
            { "[educational_program]", this.educationalProgram },
            { "[time]", this.time },
            { "[student_name]", work.StudentName },
            { "[theme]", work.Theme },
            { "[supervisor]", work.Supervisor + ", " + (string.IsNullOrWhiteSpace(work.SupervisorInfo) ? new string('_', 30) : work.SupervisorInfo) },
            {
                "[reviewer]", (string.IsNullOrWhiteSpace(work.Reviewer) ? new string('_', 20) : work.Reviewer) + ", " +
                (string.IsNullOrWhiteSpace(work.ReviewerInfo) ? new string('_', 30) : work.ReviewerInfo)
            },
            { "[degree]", Degrees[this.academicDegree] },
            { "[chairman]", GetSurnameWithInitials(this.chairman.Name) },
            { "[secretary]", GetSurnameWithInitials(this.secretary) },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInParagraphs(doc, placeholders);
        ReplacePlaceholdersInTables(doc, placeholders);

        this.FillChairmanWithComissionMembers(doc.Tables[1]);
        this.FillChairmanWithComissionMembers(doc.Tables[2]);

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();

        return (memoryStream, $"Протокол защиты {work.StudentName}.docx");
    }

    /// <summary>
    /// Generates a final protocol document for the state examination commission meeting.
    /// The method populates a DOCX template with commission data, member information, and student lists.
    /// </summary>
    /// <param name="stream">Input stream containing the DOCX template document.</param>
    /// <returns>A tuple containing the generated document stream and filename.</returns>
    public (Stream File, string FileName) GenerateFinalProtocol(Stream stream)
    {
        var placeholders = new Dictionary<string, string>
        {
            { "[commission_number]", this.commissionNumber },
            { "[date]", this.date },
            { "[academic_degree]", this.academicDegree },
            { "[major]", this.major },
            { "[educational_program]", this.educationalProgram },
            { "[time]", this.time },
            { "[chairman_initials]", GetSurnameWithInitials(this.chairman.Name) },
            { "[secretary_initials]", GetSurnameWithInitials(this.secretary) },
        };

        using var doc = new XWPFDocument(stream);

        ReplacePlaceholdersInParagraphs(doc, placeholders);
        ReplacePlaceholdersInTables(doc, placeholders);

        this.FillChairmanWithComissionMembers(doc.Tables[1]);
        var students = this.meeting.StudentWorks.Select(w => w.StudentName).ToList();
        GenerateMembersList(students, doc.Tables[2].GetRow(0).GetCell(0));

        var memoryStream = new MemoryStream();
        doc.Write(memoryStream);
        memoryStream.Position = 0;
        stream.Dispose();

        return (memoryStream, $"Протокол итоговый {this.commissionNumber}.docx");
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

    private static void ReplacePlaceholdersInTables(XWPFDocument doc, Dictionary<string, string> placeholderReplacements)
    {
        var regex = new Regex(@"\[([^\]]+)\]", RegexOptions.Compiled);

        foreach (var table in doc.Tables)
        {
            foreach (var row in table.Rows)
            {
                foreach (var cell in row.GetTableCells())
                {
                    foreach (var paragraph in cell.Paragraphs)
                    {
                        ReplacePlaceholdersInParagraph(paragraph, placeholderReplacements, regex);
                    }
                }
            }
        }
    }

    private static void ReplacePlaceholdersInParagraphs(XWPFDocument doc, Dictionary<string, string> placeholderReplacements)
    {
        var regex = new Regex(@"\[([^\]]+)\]", RegexOptions.Compiled);

        foreach (var paragraph in doc.Paragraphs)
        {
            ReplacePlaceholdersInParagraph(paragraph, placeholderReplacements, regex);
        }
    }

    private static void ReplacePlaceholdersInParagraph(XWPFParagraph paragraph, Dictionary<string, string> placeholderReplacements, Regex regex)
    {
        string originalText = paragraph.Text;
        if (string.IsNullOrEmpty(originalText))
        {
            return;
        }

        var matches = regex.Matches(originalText);

        if (matches.Count == 0)
        {
            return;
        }

        foreach (Match match in matches)
        {
            if (placeholderReplacements.TryGetValue(match.Value, out string? replacement))
            {
                paragraph.ReplaceText(match.Value, replacement);
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
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return string.Empty;
        }

        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return parts.Length switch
        {
            0 => string.Empty,
            1 => parts[0],
            2 => $"{parts[0]} {parts[1][0]}.",
            _ => $"{parts[0]} {parts[1][0]}. {parts[2][0]}.",
        };
    }

    private static void GenerateMembersList(IEnumerable<string> members, XWPFTableCell cell)
    {
        int number = 1;
        var currentParagraph = cell.Paragraphs[0];

        foreach (var member in members)
        {
            var currentRun = currentParagraph.CreateRun();
            SetFormattedTextToRun(currentRun, $"{number++}. {member};");
            currentParagraph = cell.AddParagraph();
        }
    }

    private void GenerateMemberInfoText(XWPFTableCell cell, MemberDto member, string number, bool isChairman)
    {
        var nameAndInfoParagraph = cell.AddParagraph();
        var infoBeforeName = number + (isChairman ? " Председатель государственной экзаменационной комиссии:" : string.Empty) + " ";
        var infoBeforeNameRun = nameAndInfoParagraph.CreateRun();
        infoBeforeNameRun.SetText(infoBeforeName);
        var nameRun = nameAndInfoParagraph.CreateRun();
        nameRun.IsItalic = true;
        nameRun.SetText(member.Name + ", ");

        var infoRun = nameAndInfoParagraph.CreateRun();
        var infoText = !string.IsNullOrWhiteSpace(member.InformationRu)
            ? member.InformationRu + (isChairman ? ',' : '.')
            : new string('_', 90) + (isChairman ? ',' : '.');
        infoRun.SetText(infoText);

        if (isChairman)
        {
            var orderParagraph = cell.AddParagraph();
            var orderRun = orderParagraph.CreateRun();
            orderRun.SetText($"утвержден приказом от {this.chairmanOrder} (с изменениями и дополнениями).");
        }

        var emailParagraph = cell.AddParagraph();
        var emailRun = emailParagraph.CreateRun();
        var emailText = "Электронный адрес: " +
            (!string.IsNullOrWhiteSpace(member.Email)
               ? member.Email
               : new string('_', 25));
        emailRun.SetText(emailText);

        var phoneParagraph = cell.AddParagraph();
        var phoneRun = phoneParagraph.CreateRun();
        var phoneText = "Контактный телефон: " +
            (!string.IsNullOrWhiteSpace(member.Phone)
                ? member.Phone
                : new string('_', 25));
        phoneRun.SetText(phoneText);
    }

    private (string ComissionNumber, string Major, string EducationalProgram, string AcademicDegree) ProcessMeetingInfo()
    {
        var info = this.meeting.Info;

        if (info == null || !info.Contains(Prefix))
        {
            throw new ArgumentException("Invalid meeting information.");
        }

        var startIndex = info.IndexOf(Prefix, StringComparison.Ordinal) + Prefix.Length;
        var comissionNumber = info.Substring(startIndex, NumberLength);
        var majorInfo = MajorInfoDictionary[comissionNumber.Split('-')[0]];
        string admissionYear = "    ";

        Match match = Regex.Match(info, @"20\d{2}(?!\d|-)");

        if (match.Success)
        {
            admissionYear = match.Value;
        }

        var educationalProgram = majorInfo.EducationalProgram.Replace("[year]", admissionYear);

        return (comissionNumber, majorInfo.Major, educationalProgram, majorInfo.AcademicDegree);
    }

    private void FillGradingSheetStudentTable(XWPFTable table)
    {
        var studentList = this.meeting.StudentWorks.Select((work) => work.StudentName);
        int number = 1;

        foreach (var student in studentList)
        {
            var row = table.CreateRow();
            var currentCell = row.GetCell(0);
            var numberRun = currentCell.Paragraphs[0].CreateRun();
            currentCell.SetVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
            currentCell.Paragraphs[0].Alignment = ParagraphAlignment.CENTER;
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

    private void FillChairmanWithComissionMembers(XWPFTable table)
    {
        var cell = table.Rows[0].GetCell(0);
        var chairmanParagraph = cell.Paragraphs[0];

        var chairmanSpanRun = chairmanParagraph.CreateRun();
        chairmanSpanRun.SetText($"Председатель: ");
        var chairmanRun = chairmanParagraph.CreateRun();
        chairmanRun.IsItalic = true;
        chairmanRun.SetText(this.chairman.Name);

        var membersSpanParagraph = cell.AddParagraph();
        var membersSpanRun = membersSpanParagraph.CreateRun();
        membersSpanRun.SetText("Члены:");
        int currentNumber = 1;

        for (int i = 0; i < this.meeting.Members.Count; i++)
        {
            var currentMember = this.meeting.Members[i];
            if (currentMember.Id == this.chairman.Id)
            {
                continue;
            }

            var currentMemberParagraph = cell.AddParagraph();
            var currentMemberRun = currentMemberParagraph.CreateRun();
            currentMemberRun.IsItalic = true;
            currentMemberRun.SetText($"{currentNumber++}. {currentMember.Name}");
        }
    }
}