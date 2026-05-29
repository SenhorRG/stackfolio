"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTechnologyRelationSchema = exports.technologyRelationSchema = void 0;
const zod_1 = require("zod");
const relation_type_1 = require("../enums/relation-type");
exports.technologyRelationSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    sourceId: zod_1.z.string(),
    targetId: zod_1.z.string(),
    relationType: zod_1.z.enum(relation_type_1.RELATION_TYPES),
});
exports.createTechnologyRelationSchema = exports.technologyRelationSchema.omit({
    id: true,
});
//# sourceMappingURL=technology-relation.js.map