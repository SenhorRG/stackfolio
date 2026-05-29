import { z } from 'zod';
export declare const technologyUrlsSchema: z.ZodOptional<z.ZodObject<{
    official: z.ZodOptional<z.ZodString>;
    docs: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    roadmap: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    github?: string | undefined;
    roadmap?: string | undefined;
    docs?: string | undefined;
    official?: string | undefined;
}, {
    github?: string | undefined;
    roadmap?: string | undefined;
    docs?: string | undefined;
    official?: string | undefined;
}>>;
export declare const technologySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    category: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    urls: z.ZodOptional<z.ZodObject<{
        official: z.ZodOptional<z.ZodString>;
        docs: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        roadmap: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }>>;
    resources: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    newsCache: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    slug: string;
    category: string;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | null | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
    newsCache?: Record<string, unknown>[] | undefined;
}, {
    id: string;
    name: string;
    slug: string;
    category: string;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | null | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
    newsCache?: Record<string, unknown>[] | undefined;
}>;
export type Technology = z.infer<typeof technologySchema>;
export declare const createTechnologySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    category: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    urls: z.ZodOptional<z.ZodObject<{
        official: z.ZodOptional<z.ZodString>;
        docs: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        roadmap: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }>>;
    resources: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    category: string;
    description?: string | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
}, {
    name: string;
    slug: string;
    category: string;
    description?: string | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
}>;
export declare const updateTechnologySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    urls: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        official: z.ZodOptional<z.ZodString>;
        docs: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        roadmap: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }, {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    }>>>;
    resources: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
    category?: string | undefined;
    description?: string | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    category?: string | undefined;
    description?: string | undefined;
    urls?: {
        github?: string | undefined;
        roadmap?: string | undefined;
        docs?: string | undefined;
        official?: string | undefined;
    } | undefined;
    resources?: Record<string, unknown>[] | undefined;
}>;
export declare const listTechnologiesQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    category?: string | undefined;
    q?: string | undefined;
}, {
    category?: string | undefined;
    limit?: number | undefined;
    q?: string | undefined;
    offset?: number | undefined;
}>;
//# sourceMappingURL=technology.d.ts.map