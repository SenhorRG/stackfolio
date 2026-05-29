"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createProfileSchema = exports.profileSchema = void 0;
const zod_1 = require("zod");
exports.profileSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    isMain: zod_1.z.boolean(),
    basedOnProfileId: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.createProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    basedOnProfileId: zod_1.z.string().optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
});
//# sourceMappingURL=profile.js.map