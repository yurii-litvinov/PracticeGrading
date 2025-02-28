// <copyright file="ScheduleParser.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations;

using System.Globalization;
using System.Text.RegularExpressions;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using PracticeGrading.Data.Entities;

/// <summary>
/// Class for parsing the schedule.
/// </summary>
public class ScheduleParser
{
    private const string TextInBracketsPattern = @" \([^)]*\)";

    private readonly Stream scheduleFile;
    private readonly List<Meeting> meetings = [];

    private readonly List<string> headers;

    private readonly List<List<string>> separator;

    private readonly int membersColumn;
    private int rowIndex;

    /// <summary>
    /// Initializes a new instance of the <see cref="ScheduleParser"/> class.
    /// </summary>
    /// <param name="scheduleFile">Schedule file to parse.</param>
    /// <param name="headers">List of headers.</param>
    /// <param name="separator">Separator for meetings.</param>
    /// <param name="membersColumn">Members column index.</param>
    public ScheduleParser(
        Stream scheduleFile,
        List<string> headers,
        List<List<string>> separator,
        int membersColumn)
    {
        this.scheduleFile = scheduleFile;
        this.headers = headers;
        this.separator = separator;
        this.membersColumn = membersColumn;
        this.rowIndex = membersColumn > 0 ? 1 : 0;
    }

    /// <summary>
    /// Parse the schedule for the meetings.
    /// </summary>
    /// <returns>List of meetings <see cref="Meeting"/>.</returns>
    public List<Meeting> Parse()
    {
        var scheduleWorkbook = new XSSFWorkbook(this.scheduleFile);
        scheduleWorkbook.MissingCellPolicy = MissingCellPolicy.CREATE_NULL_AS_BLANK;
        var sheet = scheduleWorkbook.GetSheetAt(0);

        while (this.rowIndex <= sheet.LastRowNum)
        {
            if (!CellsAreEmpty(sheet.GetRow(this.rowIndex).Cells))
            {
                this.FetchMeeting(sheet);
            }

            this.rowIndex++;
        }

        return this.meetings;
    }

    private static bool CellsAreEmpty(IEnumerable<ICell> cells)
        => cells.All(cell => cell.CellType == CellType.Blank);

    private static List<User> FetchMembers(List<ICell> cells)
    {
        return (from cell in cells
                where !GetCellValue(cell).Contains("Секретарь")
                select new User
                    { UserName = GetCellValue(cell).Replace("Председатель: ", string.Empty).Trim(), RoleId = 2, })
            .ToList();
    }

    private static string GetCellValue(ICell cell)
    {
        switch (cell.CellType)
        {
            case CellType.String:
                return cell.StringCellValue;
            case CellType.Numeric:
                return cell.NumericCellValue.ToString(CultureInfo.CurrentCulture);
            case CellType.Boolean:
                return cell.BooleanCellValue.ToString();
            case CellType.Unknown:
            case CellType.Formula:
            case CellType.Blank:
            case CellType.Error:
            default:
                return string.Empty;
        }
    }

    private void FetchMeeting(ISheet sheet)
    {
        var row = sheet.GetRow(this.rowIndex);
        var cells = new List<List<ICell>>();
        var membersCells = new List<ICell>();

        while (this.rowIndex <= sheet.LastRowNum && !CellsAreEmpty(row.Cells))
        {
            var rowCells = new List<ICell>();
            for (var i = 0; i < this.headers.Count; i++)
            {
                rowCells.Add(row.GetCell(i));
            }

            if (this.membersColumn >= 0 && row.GetCell(this.membersColumn).CellType != CellType.Blank)
            {
                membersCells.Add(row.GetCell(this.membersColumn));
            }

            cells.Add(rowCells);

            this.rowIndex++;
            row = sheet.GetRow(this.rowIndex);
        }

        if (cells.Count == this.separator.Count)
        {
            return;
        }

        this.meetings.Add(this.ProcessSeparator(cells[..this.separator.Count]));
        this.meetings.Last().StudentWorks = this.FetchStudentWork(cells.Skip(this.separator.Count));

        if (this.membersColumn < 0)
        {
            return;
        }

        this.meetings.Last().Members = FetchMembers(membersCells);
        if ((this.meetings.Last().Members ?? []).Count != 0)
        {
            return;
        }

        foreach (var member in this.meetings.SkipLast(1).Last().Members ?? [])
        {
            this.meetings.Last().Members?.Add(new User { UserName = member.UserName, RoleId = 2 });
        }
    }

    private Meeting ProcessSeparator(IEnumerable<List<ICell>> cells)
    {
        var data = new Dictionary<string, string>
        {
            { DataFields.Date, string.Empty },
            { DataFields.Time, string.Empty },
            { DataFields.Auditorium, string.Empty },
            { DataFields.Info, string.Empty },
            { DataFields.CallLink, string.Empty },
        };

        var meeting = new Meeting { StudentWorks = [], Criteria = [] };

        foreach (var (row, index) in cells.Select((row, index) => (row, index)))
        {
            var separatorRow = this.separator[index];
            for (var i = 0; i < separatorRow.Count; i++)
            {
                if (separatorRow[i] == string.Empty)
                {
                    continue;
                }

                if (separatorRow[i].Contains(','))
                {
                    var separatorParts = separatorRow[i].Split(',');
                    var rowParts = GetCellValue(row[i]).Split(',');
                    for (var j = 0; j < separatorParts.Length; j++)
                    {
                        data[separatorParts[j].Trim()] = rowParts[j].Trim();
                    }
                }
                else
                {
                    data[separatorRow[i]] = GetCellValue(row[i]).Trim();
                }
            }
        }

        meeting.DateAndTime = DateTime.Parse(
            $"{Regex.Replace(data[DataFields.Date], TextInBracketsPattern, DateTime.Now.Year.ToString())}, {data[DataFields.Time]}",
            new CultureInfo("ru-RU"));
        meeting.Auditorium = data[DataFields.Auditorium];
        meeting.Info = data[DataFields.Info];
        meeting.CallLink = data[DataFields.CallLink];

        return meeting;
    }

    private List<StudentWork> FetchStudentWork(IEnumerable<List<ICell>> cells)
    {
        var works = new List<StudentWork>();
        foreach (var row in cells)
        {
            var data = new Dictionary<string, string>
            {
                { DataFields.StudentName, string.Empty },
                { DataFields.StudentInfo, string.Empty },
                { DataFields.Theme, string.Empty },
                { DataFields.Supervisor, string.Empty },
                { DataFields.Consultant, string.Empty },
                { DataFields.Reviewer, string.Empty },
            };

            for (var i = 0; i < this.headers.Count; i++)
            {
                if (this.headers[i] == string.Empty)
                {
                    continue;
                }

                data[this.headers[i]] = GetCellValue(row[i]).Trim();
            }

            var work = new StudentWork
            {
                StudentName = data[DataFields.StudentName],
                Info = data[DataFields.StudentInfo],
                Theme = data[DataFields.Theme],
                Supervisor = data[DataFields.Supervisor],
                Consultant = data[DataFields.Consultant],
                Reviewer = data[DataFields.Reviewer],
                AverageCriteriaMarks = [],
            };

            if (work.StudentName == string.Empty || work.Theme == string.Empty || work.Supervisor == string.Empty)
            {
                continue;
            }

            works.Add(work);
        }

        return works;
    }

    private static class DataFields
    {
        public const string Date = "date";
        public const string Time = "time";
        public const string Auditorium = "auditorium";
        public const string Info = "info";
        public const string CallLink = "callLink";

        public const string StudentName = "studentName";
        public const string StudentInfo = "info";
        public const string Theme = "theme";
        public const string Supervisor = "supervisor";
        public const string Consultant = "consultant";
        public const string Reviewer = "reviewer";
    }
}