'use client';

type SelectableItem = {
  id: string;
  label: string;
  hint?: string;
};

type Props = {
  items: SelectableItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
};

export function BackupSelectionList({
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  disabled = false,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No items available.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="text-sm text-primary underline disabled:opacity-50"
          disabled={disabled}
          onClick={onSelectAll}
        >
          Select all
        </button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline disabled:opacity-50"
          disabled={disabled}
          onClick={onClearAll}
        >
          Clear
        </button>
      </div>
      <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              id={`backup-select-${item.id}`}
              className="mt-1"
              checked={selectedIds.has(item.id)}
              disabled={disabled}
              onChange={() => onToggle(item.id)}
            />
            <label
              htmlFor={`backup-select-${item.id}`}
              className="cursor-pointer text-sm leading-snug"
            >
              <span className="font-medium">{item.label}</span>
              {item.hint ? (
                <span className="block text-muted-foreground">{item.hint}</span>
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
