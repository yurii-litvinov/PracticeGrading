// <copyright file="CriteriaGroupRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Сlass for interacting with the critetia group entity.
/// </summary>
/// <param name="context"> Database context.</param>
public class CriteriaGroupRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new criteria group.
    /// </summary>
    /// <param name="group">New criteria group.</param>
    public async Task Create(CriteriaGroup group)
    {
        await context.CriteriaGroup.AddAsync(group);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates criteria group.
    /// </summary>
    /// <param name="group">Criteria group to update.</param>
    public async Task Update(CriteriaGroup group)
    {
        context.CriteriaGroup.Update(group);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets criteria group by id.
    /// </summary>
    /// <param name="id">Criteria group id.</param>
    /// <returns>Criteria group.</returns>
    public async Task<CriteriaGroup?> GetById(int id) =>
        await context.CriteriaGroup.Include(group => group.Criteria).ThenInclude(criteria => criteria.Rules)
            .Include(group => group.MarkScales)
            .FirstOrDefaultAsync(group => group.Id == id);

    /// <summary>
    /// Gets all criteria groups.
    /// </summary>
    /// <returns>List of criteria groups.</returns>
    public async Task<List<CriteriaGroup>> GetAll() =>
        await context.CriteriaGroup.Include(group => group.Criteria).ThenInclude(criteria => criteria.Rules)
            .Include(group => group.MarkScales).ToListAsync();

    /// <summary>
    /// Deletes criteria group.
    /// </summary>
    /// <param name="group">Criteria group to delete.</param>
    public async Task Delete(CriteriaGroup group)
    {
        context.CriteriaGroup.Remove(group);
        await context.SaveChangesAsync();
    }
}