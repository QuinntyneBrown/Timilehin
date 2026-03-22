using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Models;

namespace Timilehin.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Devotional> Devotionals => Set<Devotional>();
    public DbSet<VerseOfTheDay> VersesOfTheDay => Set<VerseOfTheDay>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Devotional>(entity =>
        {
            entity.HasIndex(d => d.Date).IsUnique();
        });

        modelBuilder.Entity<VerseOfTheDay>(entity =>
        {
            entity.HasIndex(v => v.Date).IsUnique();
        });
    }
}
