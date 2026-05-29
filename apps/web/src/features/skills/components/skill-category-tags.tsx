export function SkillCategoryTags({ categories }: { categories: string[] }) {
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <span
          key={cat}
          className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
        >
          {cat}
        </span>
      ))}
    </div>
  );
}
