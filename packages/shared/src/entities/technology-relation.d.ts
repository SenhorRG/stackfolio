import { z } from 'zod';
export declare const technologyRelationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodString;
    targetId: z.ZodString;
    relationType: z.ZodEnum<[string, ...string[]]>;
}, "strip", z.ZodTypeAny, {
    sourceId: string;
    targetId: string;
    relationType: string;
    id?: string | undefined;
}, {
    sourceId: string;
    targetId: string;
    relationType: string;
    id?: string | undefined;
}>;
export type TechnologyRelation = z.infer<typeof technologyRelationSchema>;
export declare const createTechnologyRelationSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodString;
    targetId: z.ZodString;
    relationType: z.ZodEnum<[string, ...string[]]>;
}, "id">, "strip", z.ZodTypeAny, {
    sourceId: string;
    targetId: string;
    relationType: string;
}, {
    sourceId: string;
    targetId: string;
    relationType: string;
}>;
//# sourceMappingURL=technology-relation.d.ts.map