"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeSectionConfig = exports.updateResumeProjectSchema = exports.createResumeProjectSchema = exports.resumeProjectSchema = exports.jsonLayoutSchema = exports.resumeSectionContentSchema = void 0;
const zod_1 = require("zod");
const resume_section_1 = require("../enums/resume-section");
const sectionIdEnum = zod_1.z.enum(resume_section_1.ResumeSectionId);
const forbiddenPositionKeys = zod_1.z
    .object({
    x: zod_1.z.never().optional(),
    y: zod_1.z.never().optional(),
    left: zod_1.z.never().optional(),
    top: zod_1.z.never().optional(),
    position: zod_1.z.never().optional(),
})
    .strict();
exports.resumeSectionContentSchema = zod_1.z
    .record(zod_1.z.string(), zod_1.z.unknown())
    .and(forbiddenPositionKeys);
exports.jsonLayoutSchema = zod_1.z
    .object({
    sections: zod_1.z.record(sectionIdEnum, exports.resumeSectionContentSchema),
})
    .strict();
exports.resumeProjectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    profileId: zod_1.z.string(),
    name: zod_1.z.string().default('My Resume'),
    theme: zod_1.z.string().default('classic'),
    font: zod_1.z.string().default('inter'),
    spacing: zod_1.z.enum(['compact', 'normal', 'relaxed']).default('normal'),
    sectionOrder: zod_1.z.array(sectionIdEnum),
    visibility: zod_1.z.record(sectionIdEnum, zod_1.z.boolean()),
    dividerStyle: zod_1.z.enum(['none', 'line', 'dotted']).default('line'),
    pageCount: zod_1.z.number().int().min(1).max(3).default(1),
    jsonLayout: exports.jsonLayoutSchema,
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.createResumeProjectSchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    theme: zod_1.z.string().optional(),
    font: zod_1.z.string().optional(),
    spacing: exports.resumeProjectSchema.shape.spacing.optional(),
    sectionOrder: zod_1.z.array(sectionIdEnum).optional(),
    visibility: zod_1.z.record(sectionIdEnum, zod_1.z.boolean()).optional(),
    dividerStyle: exports.resumeProjectSchema.shape.dividerStyle.optional(),
    pageCount: zod_1.z.number().int().min(1).max(3).optional(),
    jsonLayout: exports.jsonLayoutSchema.optional(),
});
exports.updateResumeProjectSchema = exports.createResumeProjectSchema
    .omit({ profileId: true })
    .partial();
exports.ResumeSectionConfig = {
    header: { fields: ['fullName', 'title', 'email', 'phone', 'location'] },
    summary: { fields: ['text'] },
    skills: { fields: ['display', 'items'] },
    experience: { fields: ['items'] },
    education: { fields: ['items'] },
    projects: { fields: ['items'] },
    certifications: { fields: ['items'] },
    languages: { fields: ['items'] },
    links: { fields: ['items'] },
};
//# sourceMappingURL=resume-project.js.map