import { z } from 'zod';
export declare const resumeSectionContentSchema: z.ZodIntersection<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodObject<{
    x: z.ZodOptional<z.ZodNever>;
    y: z.ZodOptional<z.ZodNever>;
    left: z.ZodOptional<z.ZodNever>;
    top: z.ZodOptional<z.ZodNever>;
    position: z.ZodOptional<z.ZodNever>;
}, "strict", z.ZodTypeAny, {
    x?: undefined;
    y?: undefined;
    left?: undefined;
    top?: undefined;
    position?: undefined;
}, {
    x?: undefined;
    y?: undefined;
    left?: undefined;
    top?: undefined;
    position?: undefined;
}>>;
export declare const jsonLayoutSchema: z.ZodObject<{
    sections: z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodIntersection<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodObject<{
        x: z.ZodOptional<z.ZodNever>;
        y: z.ZodOptional<z.ZodNever>;
        left: z.ZodOptional<z.ZodNever>;
        top: z.ZodOptional<z.ZodNever>;
        position: z.ZodOptional<z.ZodNever>;
    }, "strict", z.ZodTypeAny, {
        x?: undefined;
        y?: undefined;
        left?: undefined;
        top?: undefined;
        position?: undefined;
    }, {
        x?: undefined;
        y?: undefined;
        left?: undefined;
        top?: undefined;
        position?: undefined;
    }>>>;
}, "strict", z.ZodTypeAny, {
    sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
        x?: undefined;
        y?: undefined;
        left?: undefined;
        top?: undefined;
        position?: undefined;
    }>>;
}, {
    sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
        x?: undefined;
        y?: undefined;
        left?: undefined;
        top?: undefined;
        position?: undefined;
    }>>;
}>;
export declare const resumeProjectSchema: z.ZodObject<{
    id: z.ZodString;
    profileId: z.ZodString;
    name: z.ZodDefault<z.ZodString>;
    theme: z.ZodDefault<z.ZodString>;
    font: z.ZodDefault<z.ZodString>;
    spacing: z.ZodDefault<z.ZodEnum<["compact", "normal", "relaxed"]>>;
    sectionOrder: z.ZodArray<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, "many">;
    visibility: z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodBoolean>;
    dividerStyle: z.ZodDefault<z.ZodEnum<["none", "line", "dotted"]>>;
    pageCount: z.ZodDefault<z.ZodNumber>;
    jsonLayout: z.ZodObject<{
        sections: z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodIntersection<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodObject<{
            x: z.ZodOptional<z.ZodNever>;
            y: z.ZodOptional<z.ZodNever>;
            left: z.ZodOptional<z.ZodNever>;
            top: z.ZodOptional<z.ZodNever>;
            position: z.ZodOptional<z.ZodNever>;
        }, "strict", z.ZodTypeAny, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>>;
    }, "strict", z.ZodTypeAny, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    profileId: string;
    theme: string;
    font: string;
    spacing: "compact" | "normal" | "relaxed";
    sectionOrder: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[];
    visibility: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>>;
    dividerStyle: "none" | "line" | "dotted";
    pageCount: number;
    jsonLayout: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    };
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}, {
    id: string;
    profileId: string;
    sectionOrder: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[];
    visibility: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>>;
    jsonLayout: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    };
    name?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    theme?: string | undefined;
    font?: string | undefined;
    spacing?: "compact" | "normal" | "relaxed" | undefined;
    dividerStyle?: "none" | "line" | "dotted" | undefined;
    pageCount?: number | undefined;
}>;
export type ResumeProject = z.infer<typeof resumeProjectSchema>;
export type JsonLayout = z.infer<typeof jsonLayoutSchema>;
export declare const createResumeProjectSchema: z.ZodObject<{
    profileId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    theme: z.ZodOptional<z.ZodString>;
    font: z.ZodOptional<z.ZodString>;
    spacing: z.ZodOptional<z.ZodDefault<z.ZodEnum<["compact", "normal", "relaxed"]>>>;
    sectionOrder: z.ZodOptional<z.ZodArray<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, "many">>;
    visibility: z.ZodOptional<z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodBoolean>>;
    dividerStyle: z.ZodOptional<z.ZodDefault<z.ZodEnum<["none", "line", "dotted"]>>>;
    pageCount: z.ZodOptional<z.ZodNumber>;
    jsonLayout: z.ZodOptional<z.ZodObject<{
        sections: z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodIntersection<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodObject<{
            x: z.ZodOptional<z.ZodNever>;
            y: z.ZodOptional<z.ZodNever>;
            left: z.ZodOptional<z.ZodNever>;
            top: z.ZodOptional<z.ZodNever>;
            position: z.ZodOptional<z.ZodNever>;
        }, "strict", z.ZodTypeAny, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>>;
    }, "strict", z.ZodTypeAny, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }>>;
}, "strip", z.ZodTypeAny, {
    profileId: string;
    name?: string | undefined;
    theme?: string | undefined;
    font?: string | undefined;
    spacing?: "compact" | "normal" | "relaxed" | undefined;
    sectionOrder?: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[] | undefined;
    visibility?: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>> | undefined;
    dividerStyle?: "none" | "line" | "dotted" | undefined;
    pageCount?: number | undefined;
    jsonLayout?: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    } | undefined;
}, {
    profileId: string;
    name?: string | undefined;
    theme?: string | undefined;
    font?: string | undefined;
    spacing?: "compact" | "normal" | "relaxed" | undefined;
    sectionOrder?: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[] | undefined;
    visibility?: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>> | undefined;
    dividerStyle?: "none" | "line" | "dotted" | undefined;
    pageCount?: number | undefined;
    jsonLayout?: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    } | undefined;
}>;
export declare const updateResumeProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    theme: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    font: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    spacing: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["compact", "normal", "relaxed"]>>>>;
    sectionOrder: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, "many">>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodBoolean>>>;
    dividerStyle: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["none", "line", "dotted"]>>>>;
    pageCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    jsonLayout: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        sections: z.ZodRecord<z.ZodEnum<["header", "summary", "skills", "experience", "education", "projects", "certifications", "languages", "links"]>, z.ZodIntersection<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodObject<{
            x: z.ZodOptional<z.ZodNever>;
            y: z.ZodOptional<z.ZodNever>;
            left: z.ZodOptional<z.ZodNever>;
            top: z.ZodOptional<z.ZodNever>;
            position: z.ZodOptional<z.ZodNever>;
        }, "strict", z.ZodTypeAny, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }, {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>>;
    }, "strict", z.ZodTypeAny, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }, {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    }>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    theme?: string | undefined;
    font?: string | undefined;
    spacing?: "compact" | "normal" | "relaxed" | undefined;
    sectionOrder?: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[] | undefined;
    visibility?: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>> | undefined;
    dividerStyle?: "none" | "line" | "dotted" | undefined;
    pageCount?: number | undefined;
    jsonLayout?: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    } | undefined;
}, {
    name?: string | undefined;
    theme?: string | undefined;
    font?: string | undefined;
    spacing?: "compact" | "normal" | "relaxed" | undefined;
    sectionOrder?: ("header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links")[] | undefined;
    visibility?: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", boolean>> | undefined;
    dividerStyle?: "none" | "line" | "dotted" | undefined;
    pageCount?: number | undefined;
    jsonLayout?: {
        sections: Partial<Record<"header" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "languages" | "links", Record<string, unknown> & {
            x?: undefined;
            y?: undefined;
            left?: undefined;
            top?: undefined;
            position?: undefined;
        }>>;
    } | undefined;
}>;
export declare const ResumeSectionConfig: {
    readonly header: {
        readonly fields: readonly ["fullName", "title", "email", "phone", "location"];
    };
    readonly summary: {
        readonly fields: readonly ["text"];
    };
    readonly skills: {
        readonly fields: readonly ["display", "items"];
    };
    readonly experience: {
        readonly fields: readonly ["items"];
    };
    readonly education: {
        readonly fields: readonly ["items"];
    };
    readonly projects: {
        readonly fields: readonly ["items"];
    };
    readonly certifications: {
        readonly fields: readonly ["items"];
    };
    readonly languages: {
        readonly fields: readonly ["items"];
    };
    readonly links: {
        readonly fields: readonly ["items"];
    };
};
//# sourceMappingURL=resume-project.d.ts.map