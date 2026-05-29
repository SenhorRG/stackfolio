import { z } from 'zod';
export declare const profileTechnologySchema: z.ZodObject<{
    profileId: z.ZodString;
    technologyId: z.ZodString;
    level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
    years: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    highlight: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    profileId: string;
    technologyId: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    highlight: boolean;
    years?: number | null | undefined;
}, {
    profileId: string;
    technologyId: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    years?: number | null | undefined;
    highlight?: boolean | undefined;
}>;
export type ProfileTechnology = z.infer<typeof profileTechnologySchema>;
export declare const upsertProfileTechnologySchema: z.ZodObject<{
    technologyId: z.ZodString;
    level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
    years: z.ZodOptional<z.ZodNumber>;
    highlight: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    technologyId: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    years?: number | undefined;
    highlight?: boolean | undefined;
}, {
    technologyId: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    years?: number | undefined;
    highlight?: boolean | undefined;
}>;
//# sourceMappingURL=profile-technology.d.ts.map