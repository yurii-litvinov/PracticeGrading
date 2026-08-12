// <copyright file="TrustedMemberAccessRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Provides database operations for trusted member accesses.
/// </summary>
/// <param name="context">The application database context.</param>
public class TrustedMemberAccessRepository(AppDbContext context)
{
    /// <summary>
    /// Gets trusted access issued to the specified member.
    /// </summary>
    /// <param name="memberId">
    /// The identifier of the commission member.
    /// </param>
    /// <returns>
    /// The trusted access if it exists; otherwise, <see langword="null"/>.
    /// </returns>
    public async Task<TrustedMemberAccess?> GetByMemberId(int memberId)
    {
        return await context.TrustedMemberAccesses
            .SingleOrDefaultAsync(access => access.MemberId == memberId);
    }

    /// <summary>
    /// Gets active trusted access by its token hash.
    /// </summary>
    /// <param name="tokenHash">
    /// The hexadecimal hash of the presented token.
    /// </param>
    /// <returns>
    /// Active trusted access with its member and role,
    /// or <see langword="null"/> if the token is invalid or revoked.
    /// </returns>
    public async Task<TrustedMemberAccess?> GetActiveByTokenHash(string tokenHash)
    {
        return await context.TrustedMemberAccesses
            .Include(access => access.Member)
            .ThenInclude(member => member!.Role)
            .SingleOrDefaultAsync(access =>
                    access.TokenHash == tokenHash && access.RevokedAt == null);
    }

    /// <summary>
    /// Determines whether the specified trusted access is active
    /// and belongs to the specified commission member.
    /// </summary>
    /// <param name="accessId">
    /// The trusted access identifier.
    /// </param>
    /// <param name="memberId">
    /// The commission member identifier.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if the access exists, belongs to the member,
    /// and has not been revoked; otherwise, <see langword="false"/>.
    /// </returns>
    public async Task<bool> IsActive(
        int accessId,
        int memberId)
    {
        return await context.TrustedMemberAccesses
            .AnyAsync(access =>
                access.Id == accessId &&
                access.MemberId == memberId &&
                access.RevokedAt == null);
    }

    /// <summary>
    /// Adds trusted member access to the database.
    /// </summary>
    /// <param name="access">The trusted access to add.</param>
    /// <returns>
    /// A task representing the asynchronous operation.
    /// </returns>
    public async Task Create(TrustedMemberAccess access)
    {
        context.TrustedMemberAccesses.Add(access);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Saves changes made to tracked trusted access entities.
    /// </summary>
    /// <returns>
    /// A task representing the asynchronous operation.
    /// </returns>
    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}