import { z } from 'zod';
export declare const profileSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    isMain: z.ZodBoolean;
    basedOnProfileId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    name: string;
    isMain: boolean;
    basedOnProfileId?: string | null | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}, {
    userId: string;
    id: string;
    name: string;
    isMain: boolean;
    basedOnProfileId?: string | null | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}>;
export type Profile = z.infer<typeof profileSchema>;
export declare const createProfileSchema: z.ZodObject<{
    name: z.ZodString;
    basedOnProfileId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    basedOnProfileId?: string | undefined;
}, {
    name: string;
    basedOnProfileId?: string | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
}, {
    name?: string | undefined;
}>;
//# sourceMappingURL=profile.d.ts.map