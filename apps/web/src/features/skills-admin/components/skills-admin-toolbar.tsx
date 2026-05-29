'use client';

type Props = {
  categories: string[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
};

export function SkillsAdminToolbar({
  categories,
  categoryFilter,
  onCategoryFilterChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Category</span>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
