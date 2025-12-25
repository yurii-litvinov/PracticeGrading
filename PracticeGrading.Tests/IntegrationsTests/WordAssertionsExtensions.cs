using FluentAssertions;
using FluentAssertions.Streams;
using NPOI.XWPF.UserModel;

public static class WordAssertionsExtensions
{
    public static void BeEquivalentToDocxFile(
        this StreamAssertions streamAssertions,
        Stream expectedFileStream,
        bool ignoreFormatting = false,
        params object[] becauseArgs)
    {
        var actualStream = GetStream(streamAssertions.Subject);

        actualStream.Position = 0;
        expectedFileStream.Position = 0;

        using var actualDoc = new XWPFDocument(actualStream);
        using var expectedDoc = new XWPFDocument(expectedFileStream);

        CompareDocxDocuments(actualDoc, expectedDoc, ignoreFormatting);
    }

    private static void CompareDocxDocuments(
        XWPFDocument actualDoc,
        XWPFDocument expectedDoc,
        bool ignoreFormatting)
    {
        var actualParagraphs = actualDoc.Paragraphs
            .Select(p => p.Text.Trim())
            .Where(text => !string.IsNullOrEmpty(text))
            .ToList();

        var expectedParagraphs = expectedDoc.Paragraphs
            .Select(p => p.Text.Trim())
            .Where(text => !string.IsNullOrEmpty(text))
            .ToList();

        actualParagraphs.Should().BeEquivalentTo(expectedParagraphs,
            options => options.WithStrictOrdering());

        CompareTables(actualDoc, expectedDoc);

        if (!ignoreFormatting)
        {
            CompareDocumentStructure(actualDoc, expectedDoc);
        }
    }

    private static void CompareTables(
        XWPFDocument actualDoc,
        XWPFDocument expectedDoc)
    {
        actualDoc.Tables.Count.Should().Be(expectedDoc.Tables.Count);

        for (int i = 0; i < actualDoc.Tables.Count; i++)
        {
            var actualTable = actualDoc.Tables[i];
            var expectedTable = expectedDoc.Tables[i];

            actualTable.NumberOfRows.Should().Be(expectedTable.NumberOfRows);

            for (int row = 0; row < actualTable.NumberOfRows; row++)
            {
                var actualRow = actualTable.GetRow(row);
                var expectedRow = expectedTable.GetRow(row);

                if (actualRow == null || expectedRow == null)
                    continue;

                var actualCells = actualRow.GetTableCells();
                var expectedCells = expectedRow.GetTableCells();

                actualCells.Count.Should().Be(expectedCells.Count);


                for (int cell = 0; cell < actualCells.Count; cell++)
                {
                    var actualCellText = actualCells[cell].GetText().Trim();
                    var expectedCellText = expectedCells[cell].GetText().Trim();

                    actualCellText.Should().Be(expectedCellText);
                }
            }
        }
    }

    private static void CompareDocumentStructure(
        XWPFDocument actualDoc,
        XWPFDocument expectedDoc)
    {
        actualDoc.Paragraphs.Count.Should().Be(expectedDoc.Paragraphs.Count);

        for (int i = 0; i < actualDoc.Paragraphs.Count; i++)
        {
            var actualPara = actualDoc.Paragraphs[i];
            var expectedPara = expectedDoc.Paragraphs[i];

            var actualStyle = actualPara.Style;
            var expectedStyle = expectedPara.Style;

            if (actualStyle != null && expectedStyle != null)
            {
                actualStyle.Should().Be(expectedStyle);
            }
        }
    }

    private static Stream GetStream(object subject)
    {
        return subject switch
        {
            Stream stream => stream,
            _ => throw new ArgumentException(nameof(subject))
        };
    }
}