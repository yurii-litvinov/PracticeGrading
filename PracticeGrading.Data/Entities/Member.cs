namespace PracticeGrading.Data.Entities;

/// <summary>
/// Member entity.
/// </summary>
public class Member : User
{
    /// <summary>
    /// Gets or sets meeting id.
    /// </summary>
    public int MeetingId { get; set; }

    /// <summary>
    /// Gets or sets meeting.
    /// </summary>
    public Meeting Meeting { get; set; }

    /// <summary>
    /// Gets or sets marks.
    /// </summary>
    public ICollection<MemberMark> Marks { get; set; }
}