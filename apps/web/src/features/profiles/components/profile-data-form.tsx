'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  type ProfileIdentity,
  validateProfileIdentity,
} from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileListField } from './profile-list-field';
import { ProfileExperienceField } from './profile-experience-field';
import { ProfileCollapsibleSection } from './profile-collapsible-section';
import { formatPhoneDisplay, formatPhoneInput } from '../utils/format-phone';
import { formatLanguageDisplay } from '../utils/format-language';
import { formatLinkDisplay } from '../utils/format-link';
import { formFieldId } from '@/lib/form-field-id';

type ProfileDataFormProps = {
  profileId: string;
  token: string;
  initial: ProfileIdentity | null;
  profileName?: string;
  readOnly?: boolean;
  onSaved?: () => void;
  editToolbar?: ReactNode;
};

function defaultIdentity(): ProfileIdentity {
  return {
    fullName: '',
    jobTitle: '',
    summary: '',
    contact: {},
    experience: [],
    education: [],
    certificates: [],
    projects: [],
    links: [],
    languages: [],
  };
}

export function ProfileDataForm({
  profileId,
  token,
  initial,
  profileName,
  readOnly = false,
  onSaved,
  editToolbar,
}: ProfileDataFormProps) {
  const [data, setData] = useState<ProfileIdentity>(initial ?? defaultIdentity());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setData(initial);
      if (!readOnly) {
        const validation = validateProfileIdentity(initial);
        setFieldErrors(validation.success ? {} : validation.fieldErrors);
      }
    }
  }, [initial, readOnly]);

  const save = useMutation({
    mutationFn: async () => {
      const validation = validateProfileIdentity(data);
      if (!validation.success) {
        setFieldErrors(validation.fieldErrors);
        throw new Error('Please fix validation errors before saving.');
      }
      setFieldErrors({});
      const trimmedName = profileName?.trim();
      if (trimmedName) {
        await apiFetch(`/profiles/${profileId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ name: trimmedName }),
        });
      }
      return apiFetch(`/profiles/${profileId}/profile-data`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(validation.data),
      });
    },
    onSuccess: () => onSaved?.(),
  });

  const saveButton = !readOnly ? (
    <Button onClick={() => save.mutate()} disabled={save.isPending}>
      {save.isPending ? 'Saving…' : 'Save profile data'}
    </Button>
  ) : null;

  return (
    <section className="space-y-6 rounded-lg border border-border p-4">
      <h2 className="font-semibold">Profile details</h2>

      {!readOnly && (editToolbar ) && (
        <div className="flex flex-row flex-wrap items-center gap-2 border-b border-border pb-4">
          {editToolbar}
        </div>
      )}

      {Object.keys(fieldErrors).length > 0 && (
        <div
          className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {Object.entries(fieldErrors).map(([path, msg]) => (
            <p key={path}>
              {path}: {msg}
            </p>
          ))}
        </div>
      )}

      <label className="block text-sm" htmlFor={formFieldId('profile', 'full-name')}>
        Full name
        {readOnly ? (
          <p className="mt-1 text-foreground">{data.fullName?.trim() || '—'}</p>
        ) : (
          <>
            <Input
              id={formFieldId('profile', 'full-name')}
              name={formFieldId('profile', 'full-name')}
              className="mt-1"
              placeholder="e.g. Ricardo Macagnan"
              value={data.fullName ?? ''}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Profile name (above) is only for organizing profiles in the app.
            </span>
          </>
        )}
      </label>

      <label className="block text-sm" htmlFor={formFieldId('profile', 'job-title')}>
        Job title
        {readOnly ? (
          <p className="mt-1 text-foreground">{data.jobTitle?.trim() || '—'}</p>
        ) : (
          <Input
            id={formFieldId('profile', 'job-title')}
            name={formFieldId('profile', 'job-title')}
            className="mt-1"
            placeholder="e.g. Full Stack Engineer"
            value={data.jobTitle ?? ''}
            onChange={(e) => setData({ ...data, jobTitle: e.target.value })}
          />
        )}
      </label>

      <label className="block text-sm" htmlFor={formFieldId('profile', 'summary')}>
        Summary
        {readOnly ? (
          <p className="mt-1 whitespace-pre-wrap text-foreground">
            {data.summary || '—'}
          </p>
        ) : (
          <textarea
            id={formFieldId('profile', 'summary')}
            name={formFieldId('profile', 'summary')}
            className="mt-1 w-full rounded border px-2 py-1"
            rows={3}
            value={data.summary}
            onChange={(e) => setData({ ...data, summary: e.target.value })}
          />
        )}
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['location', 'Location'],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="text-sm"
            htmlFor={formFieldId('profile', 'contact', key)}
          >
            {label}
            {readOnly ? (
              <p className="mt-1 text-foreground">
                {key === 'email' && data.contact.email ? (
                  <a
                    href={`mailto:${data.contact.email}`}
                    className="text-primary hover:underline"
                  >
                    {data.contact.email}
                  </a>
                ) : key === 'phone' ? (
                  formatPhoneDisplay(data.contact.phone)
                ) : (
                  data.contact[key] || '—'
                )}
              </p>
            ) : key === 'phone' ? (
              <Input
                id={formFieldId('profile', 'contact', key)}
                name={formFieldId('profile', 'contact', key)}
                className="mt-1"
                type="tel"
                value={data.contact.phone ?? ''}
                placeholder="+55 (11) 9 8765-4321"
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: {
                      ...data.contact,
                      phone: formatPhoneInput(e.target.value),
                    },
                  })
                }
              />
            ) : (
              <Input
                id={formFieldId('profile', 'contact', key)}
                name={formFieldId('profile', 'contact', key)}
                className="mt-1"
                type={key === 'email' ? 'email' : 'text'}
                value={data.contact[key] ?? ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, [key]: e.target.value },
                  })
                }
              />
            )}
          </label>
        ))}
      </div>

      <ProfileExperienceField
        items={data.experience}
        readOnly={readOnly}
        onChange={(experience) => setData({ ...data, experience })}
      />

      <ProfileListField
        title="Education"
        items={data.education}
        readOnly={readOnly}
        onChange={(education) => setData({ ...data, education })}
        emptyItem={() => ({ institution: '' })}
        fields={[
          { key: 'institution', label: 'Institution' },
          { key: 'degree', label: 'Degree' },
          { key: 'period', label: 'Period' },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />

      <ProfileListField
        title="Projects"
        items={data.projects}
        readOnly={readOnly}
        onChange={(projects) => setData({ ...data, projects })}
        emptyItem={() => ({ name: '' })}
        fields={[
          { key: 'name', label: 'Name' },
          {
            key: 'url',
            label: 'URL',
            placeholder: 'https://…',
            inputType: 'url',
          },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />

      <ProfileListField
        title="Certifications"
        items={data.certificates}
        readOnly={readOnly}
        onChange={(certificates) => setData({ ...data, certificates })}
        emptyItem={() => ({ name: '' })}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'issuer', label: 'Issuer' },
          { key: 'date', label: 'Date' },
        ]}
      />

      <ProfileCollapsibleSection
        title="Languages"
        readOnly={readOnly}
        count={data.languages.length}
        action={
          !readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setData({
                  ...data,
                  languages: [...data.languages, { name: '', level: '' }],
                })
              }
            >
              Add
            </Button>
          ) : undefined
        }
      >
        {data.languages.length === 0 && (
          <p className="text-sm text-muted-foreground">None added yet.</p>
        )}
        {data.languages.map((lang, index) =>
          readOnly ? (
            <p key={index} className="text-sm">
              {formatLanguageDisplay(lang.name, lang.level)}
            </p>
          ) : (
            <div
              key={index}
              className="grid gap-2 rounded border border-border p-3 sm:grid-cols-2"
            >
              <Input
                id={formFieldId('profile', 'language', index, 'name')}
                name={formFieldId('profile', 'language', index, 'name')}
                placeholder="Language"
                value={lang.name}
                onChange={(e) => {
                  const languages = [...data.languages];
                  languages[index] = { ...lang, name: e.target.value };
                  setData({ ...data, languages });
                }}
              />
              <Input
                id={formFieldId('profile', 'language', index, 'level')}
                name={formFieldId('profile', 'language', index, 'level')}
                placeholder="Level"
                value={lang.level ?? ''}
                onChange={(e) => {
                  const languages = [...data.languages];
                  languages[index] = { ...lang, level: e.target.value };
                  setData({ ...data, languages });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive sm:col-span-2"
                onClick={() =>
                  setData({
                    ...data,
                    languages: data.languages.filter((_, i) => i !== index),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ),
        )}
      </ProfileCollapsibleSection>

      <ProfileCollapsibleSection
        title="Links"
        readOnly={readOnly}
        count={data.links.length}
        action={
          !readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setData({
                  ...data,
                  links: [...data.links, { label: '', url: '' }],
                })
              }
            >
              Add
            </Button>
          ) : undefined
        }
      >
        {data.links.length === 0 && (
          <p className="text-sm text-muted-foreground">None added yet.</p>
        )}
        {data.links.map((link, index) =>
          readOnly ? (
            <p key={index} className="text-sm">
              {link.url ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {formatLinkDisplay(link.label, link.url)}
                </a>
              ) : (
                formatLinkDisplay(link.label, link.url)
              )}
            </p>
          ) : (
            <div
              key={index}
              className="space-y-2 rounded border border-border p-3"
            >
              <Input
                id={formFieldId('profile', 'link', index, 'label')}
                name={formFieldId('profile', 'link', index, 'label')}
                placeholder="Label"
                value={link.label}
                onChange={(e) => {
                  const links = [...data.links];
                  links[index] = { ...link, label: e.target.value };
                  setData({ ...data, links });
                }}
              />
              <Input
                id={formFieldId('profile', 'link', index, 'url')}
                name={formFieldId('profile', 'link', index, 'url')}
                type="url"
                placeholder="https://…"
                value={link.url}
                onChange={(e) => {
                  const links = [...data.links];
                  links[index] = { ...link, url: e.target.value };
                  setData({ ...data, links });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() =>
                  setData({
                    ...data,
                    links: data.links.filter((_, i) => i !== index),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ),
        )}
      </ProfileCollapsibleSection>

      {!readOnly && saveButton}
    </section>
  );
}
