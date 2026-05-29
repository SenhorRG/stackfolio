'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileCollapsibleSection } from './profile-collapsible-section';
import { formFieldId } from '@/lib/form-field-id';

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  inputType?: 'text' | 'email' | 'url';
};

type ProfileListFieldProps<T extends Record<string, string | undefined>> = {
  title: string;
  items: T[];
  fields: FieldDef[];
  readOnly?: boolean;
  onChange: (items: T[]) => void;
  emptyItem: () => T;
};

export function ProfileListField<T extends Record<string, string | undefined>>({
  title,
  items,
  fields,
  readOnly,
  onChange,
  emptyItem,
}: ProfileListFieldProps<T>) {
  const updateItem = (index: number, key: string, value: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addButton = !readOnly ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onChange([...items, emptyItem()])}
    >
      Add
    </Button>
  ) : undefined;

  return (
    <ProfileCollapsibleSection
      title={title}
      readOnly={readOnly}
      count={items.length}
      action={addButton}
    >
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">None added yet.</p>
      )}
      {items.map((item, index) => (
        <div
          key={index}
          className="space-y-2 rounded border border-border p-3"
        >
          {readOnly ? (
            <div className="space-y-1 text-sm">
              {fields.map((field) => {
                const value = item[field.key] as string | undefined;
                if (!value) return null;
                if (field.inputType === 'url') {
                  return (
                    <p key={field.key}>
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {value}
                      </a>
                    </p>
                  );
                }
                return (
                  <p key={field.key} className="whitespace-pre-wrap">
                    {field.multiline ? value : value}
                  </p>
                );
              })}
            </div>
          ) : (
            fields.map((field) => {
              const fieldId = formFieldId(
                'profile',
                title,
                index,
                field.key,
              );
              return (
              <label key={field.key} className="block text-sm" htmlFor={fieldId}>
                {field.label}
                {field.multiline ? (
                  <textarea
                    id={fieldId}
                    name={fieldId}
                    className="mt-1 w-full rounded border px-2 py-1"
                    rows={2}
                    value={(item[field.key] as string | undefined) ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      updateItem(index, field.key, e.target.value)
                    }
                  />
                ) : (
                  <Input
                    id={fieldId}
                    name={fieldId}
                    className="mt-1"
                    type={field.inputType ?? 'text'}
                    value={(item[field.key] as string | undefined) ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      updateItem(index, field.key, e.target.value)
                    }
                  />
                )}
              </label>
            );
            })
          )}
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => removeItem(index)}
            >
              Remove
            </Button>
          )}
        </div>
      ))}
    </ProfileCollapsibleSection>
  );
}
