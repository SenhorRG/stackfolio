"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTechnologiesQuerySchema = exports.updateTechnologySchema = exports.createTechnologySchema = exports.technologySchema = exports.technologyUrlsSchema = void 0;
const zod_1 = require("zod");
exports.technologyUrlsSchema = zod_1.z
    .object({
    official: zod_1.z.string().url().optional(),
    docs: zod_1.z.string().url().optional(),
    github: zod_1.z.string().url().optional(),
    roadmap: zod_1.z.string().url().optional(),
})
    .strict()
    .optional();
exports.technologySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    urls: exports.technologyUrlsSchema,
    resources: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())).optional(),
    newsCache: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())).optional(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.createTechnologySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1).regex(/^[a-z0-9-]+$/),
    category: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    urls: exports.technologyUrlsSchema,
    resources: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())).optional(),
});
exports.updateTechnologySchema = exports.createTechnologySchema.partial();
exports.listTechnologiesQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
//# sourceMappingURL=technology.js.map