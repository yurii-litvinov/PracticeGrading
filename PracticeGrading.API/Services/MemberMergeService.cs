namespace PracticeGrading.API.Services;

using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

public record MemberMergeRequest(int[] MemberIds, int TargetId, MemberRequest Profile,
    int? TrustedAccessId, Dictionary<int, int> MarkChoices, string Version);

/// <summary>Previews and atomically merges commission members and their relationships.</summary>
public class MemberMergeService(AppDbContext context)
{
    public async Task<MergeSnapshot> Preview(int[] ids)
    {
        if (ids is null || ids.Length < 2 || ids.Length > 20 || ids.Distinct().Count() != ids.Length)
        {
            throw new InvalidOperationException("Выберите от 2 до 20 разных членов комиссии.");
        }

        var users = await context.Users.Where(u => ids.Contains(u.Id)).Include(u => u.Meetings)
            .OrderBy(u => u.Id).ToListAsync();
        if (users.Count != ids.Length || users.Any(u => u.RoleId != 2))
        {
            throw new InvalidOperationException("Некоторые члены комиссии больше не существуют или имеют другую роль.");
        }

        var marks = await context.MemberMarks.Where(m => ids.Contains(m.MemberId))
            .Include(m => m.StudentWork).Include(m => m.CriteriaMarks).ThenInclude(m => m.SelectedRules)
            .OrderBy(m => m.Id).ToListAsync();
        var accesses = await context.MeetingMemberAccesses.Where(a => ids.Contains(a.MemberId) ||
            (a.StatusChangedByUserId.HasValue && ids.Contains(a.StatusChangedByUserId.Value)))
            .OrderBy(a => a.Id).ToListAsync();
        var trusted = await context.TrustedMemberAccesses.Where(a => ids.Contains(a.MemberId)).OrderBy(a => a.Id).ToListAsync();
        var state = new
        {
            Members = users.Select(u => new { u.Id, Name = u.UserName, u.Email, u.Phone, u.InformationRu, u.InformationEn,
                MeetingIds = u.Meetings!.Select(m => m.Id).Order().ToArray() }).ToArray(),
            Marks = marks.Select(m => new { m.Id, m.MemberId, m.StudentWorkId, StudentName = m.StudentWork!.StudentName,
                m.Mark, m.Comment, Criteria = m.CriteriaMarks.OrderBy(c => c.Id).Select(c => new { c.Id, c.CriteriaId, c.Mark, c.Comment,
                    Rules = c.SelectedRules.OrderBy(r => r.RuleId).Select(r => new { r.RuleId, r.Value }).ToArray() }).ToArray() }).ToArray(),
            Accesses = accesses.Select(a => new { a.Id, a.MemberId, a.MeetingId, a.Status, a.CreatedAt, a.StatusChangedAt, a.StatusChangedByUserId }).ToArray(),
            TrustedAccesses = trusted.Select(a => new { a.Id, a.MemberId, a.CreatedAt, a.RevokedAt }).ToArray(),
        };
        var version = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(state))));
        return new MergeSnapshot(state, version, users, marks, accesses, trusted);
    }

    public async Task<int> Merge(MemberMergeRequest request)
    {
        await using var transaction = context.Database.IsRelational()
            ? await context.Database.BeginTransactionAsync(IsolationLevel.Serializable) : null;
        var snapshot = await this.Preview(request.MemberIds);
        if (snapshot.Version != request.Version)
        {
            throw new InvalidOperationException("Данные изменились. Откройте предварительный просмотр заново.");
        }

        var target = snapshot.Users.SingleOrDefault(u => u.Id == request.TargetId);
        if (target is null || request.Profile is null || string.IsNullOrWhiteSpace(request.Profile.Name) || request.MarkChoices is null)
        {
            throw new InvalidOperationException("Выберите итоговый ID и заполните имя.");
        }

        var trusted = snapshot.Trusted.SingleOrDefault(a => a.Id == request.TrustedAccessId);
        if (request.TrustedAccessId.HasValue && (trusted is null || trusted.RevokedAt.HasValue))
        {
            throw new InvalidOperationException("Выбранный доверенный доступ недоступен.");
        }

        var discardedMarks = new List<MemberMark>();
        foreach (var group in snapshot.Marks.GroupBy(m => m.StudentWorkId).Where(g => g.Count() > 1))
        {
            if (!request.MarkChoices.TryGetValue(group.Key, out var markId) || !group.Any(m => m.Id == markId))
            {
                throw new InvalidOperationException("Выберите сохраняемую оценку для каждой работы с конфликтом.");
            }

            discardedMarks.AddRange(group.Where(m => m.Id != markId));
        }

        context.MemberMarks.RemoveRange(discardedMarks);
        context.TrustedMemberAccesses.RemoveRange(snapshot.Trusted.Where(a => a != trusted));
        await context.SaveChangesAsync();

        target.UserName = request.Profile.Name.Trim();
        target.Email = request.Profile.Email;
        target.Phone = request.Profile.Phone;
        target.InformationRu = request.Profile.InformationRu;
        target.InformationEn = request.Profile.InformationEn;
        foreach (var user in snapshot.Users.Where(u => u != target))
        {
            foreach (var meeting in user.Meetings!.ToArray())
            {
                if (!target.Meetings!.Any(m => m.Id == meeting.Id))
                {
                    target.Meetings.Add(meeting);
                }

                user.Meetings.Remove(meeting);
            }
        }

        foreach (var mark in snapshot.Marks.Except(discardedMarks))
        {
            mark.Member = target;
            mark.MemberId = target.Id;
        }

        foreach (var access in snapshot.Accesses)
        {
            if (request.MemberIds.Contains(access.MemberId))
            {
                access.Member = target;
                access.MemberId = target.Id;
            }

            if (access.StatusChangedByUserId.HasValue && request.MemberIds.Contains(access.StatusChangedByUserId.Value))
            {
                access.StatusChangedByUser = target;
                access.StatusChangedByUserId = target.Id;
            }
        }

        if (trusted is not null)
        {
            trusted.Member = target;
            trusted.MemberId = target.Id;
        }

        await context.SaveChangesAsync();
        var markRepository = new MarkRepository(context);
        foreach (var workId in discardedMarks.Select(m => m.StudentWorkId).Distinct())
        {
            var retained = await markRepository.GetById(target.Id, workId);
            if (retained is not null)
            {
                await markRepository.Update(retained);
            }
        }

        context.Users.RemoveRange(snapshot.Users.Where(u => u != target));
        await context.SaveChangesAsync();
        if (transaction is not null)
        {
            await transaction.CommitAsync();
        }

        return target.Id;
    }

    public record MergeSnapshot(object Data, string Version, List<User> Users, List<MemberMark> Marks,
        List<MeetingMemberAccess> Accesses, List<TrustedMemberAccess> Trusted);
}
