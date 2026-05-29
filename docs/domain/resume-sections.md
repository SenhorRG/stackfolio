# Resume Sections (ATS)

| Section ID | Label | Key fields | ATS notes |
|------------|-------|------------|-----------|
| header | Header | fullName, title, email, phone, location | Single h1, contact as text |
| summary | Summary | text | Plain paragraph |
| skills | Skills | display, items | List or grouped lists |
| experience | Experience | items[] company, role, dates, bullets | Reverse chronological |
| education | Education | items[] institution, degree, dates | Standard headings |
| projects | Projects | items[] name, description, bullets | Optional links as text |
| certifications | Certifications | items[] name, issuer, date | List format |
| languages | Languages | items[] name, level | Simple list |
| links | Links | items[] label, url | URLs as text for ATS |

## Constraints

- No `x`, `y`, `position`, or free-form canvas coordinates in `json_layout`
- Section order from `section_order` array only
- Visibility map disables sections without deleting content
