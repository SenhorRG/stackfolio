"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProfileTechnologySchema = exports.profileTechnologySchema = void 0;
const zod_1 = require("zod");
const skill_level_1 = require("../enums/skill-level");
exports.profileTechnologySchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    technologyId: zod_1.z.string(),
    level: zod_1.z.enum([
        skill_level_1.SkillLevel.BEGINNER,
        skill_level_1.SkillLevel.INTERMEDIATE,
        skill_level_1.SkillLevel.ADVANCED,
        skill_level_1.SkillLevel.EXPERT,
    ]),
    years: zod_1.z.number().min(0).max(50).nullable().optional(),
    highlight: zod_1.z.boolean().default(false),
});
exports.upsertProfileTechnologySchema = zod_1.z.object({
    technologyId: zod_1.z.string(),
    level: exports.profileTechnologySchema.shape.level,
    years: zod_1.z.number().min(0).max(50).optional(),
    highlight: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=profile-technology.js.map