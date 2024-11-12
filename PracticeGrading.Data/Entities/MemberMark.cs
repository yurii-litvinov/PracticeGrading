namespace PracticeGrading.Data.Entities;

/// <summary>
/// Member mark entity.
/// </summary>
public class MemberMark
{
    /// <summary>
    /// Gets or sets member id.
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Gets or sets member.
    /// </summary>
    public Member Member { get; set; }

    /// <summary>
    /// Gets or sets student work id.
    /// </summary>
    public int StudentWorkId { get; set; }

    /// <summary>
    /// Gets or sets student work.
    /// </summary>
    public StudentWork StudentWork { get; set; }

    /// <summary>
    /// Gets or sets criteria marks.
    /// </summary>
    public ICollection<CriteriaMark> CriteriaMarks { get; set; }

    /// <summary>
    /// Gets or sets average mark.
    /// </summary>
    public int AverageMark { get; set; }
}