// <copyright file="MarkTableGenerator.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Integrations.XlsxGenerator;

using NPOI.SS.UserModel;
using PracticeGrading.API.Models.DTOs;

/// <summary>
/// Class to generate the mark table.
/// </summary>
public class MarkTableGenerator
{
    /// <summary>
    /// Generates the mark table.
    /// </summary>
    /// <param name="meeting">Meeting DTO.</param>
    /// <param name="memberMarks">List of member mark DTOs.</param>
    /// <returns>.xlsx file as a stream.</returns>
    public Stream Generate(MeetingDto meeting, List<MemberMarkDto> memberMarks)
    {
        var generator = new XlsxGenerator();
        var sheet = generator.CreateSheet();

        var header = new List<CellInfo> { new("ФИО студента") };
        header.AddRange(meeting.Criteria.Select(criteria => new CellInfo(criteria.Name)));
        header.Add(new CellInfo("Итоговая оценка"));

        sheet.WriteRow(header, true, false, HorizontalAlignment.Center);

        foreach (var work in meeting.StudentWorks)
        {
            sheet.WriteRow([new CellInfo(work.StudentName)]);

            var studentRow = new List<CellInfo>();
            studentRow.AddRange(
                work.AverageCriteriaMarks.Select(mark => new CellInfo(mark.AverageMark.ToString() ?? string.Empty)));
            studentRow.Add(new CellInfo(work.FinalMark ?? string.Empty));

            sheet.WriteRow(
                studentRow,
                false,
                false,
                HorizontalAlignment.Center,
                rowIndex: sheet.GetLastRowIndex(),
                columnIndex: 1);

            foreach (var member in meeting.Members)
            {
                var memberMark =
                    memberMarks.FirstOrDefault(mark => mark.StudentWorkId == work.Id && mark.MemberId == member.Id);

                if (memberMark == null)
                {
                    continue;
                }

                sheet.WriteRow([new CellInfo(member.Name)], false, true);

                var memberRow = new List<CellInfo>();
                memberRow.AddRange(
                    (memberMark.CriteriaMarks ?? []).Select(
                        mark => new CellInfo(mark.Mark.ToString() ?? string.Empty)));
                memberRow.Add(new CellInfo(memberMark.Mark.ToString() ?? string.Empty));

                sheet.WriteRow(
                    memberRow,
                    false,
                    true,
                    HorizontalAlignment.Center,
                    rowIndex: sheet.GetLastRowIndex(),
                    columnIndex: 1);
            }

            sheet.WriteEmptyRows(1);
        }

        sheet.AutosizeColumns(0, header.Count + 1);
        sheet.SetDefaultRowHeight(35);
        sheet.SetColumnWidth(5, 10);

        return generator.GetStream();
    }
}