export declare const RelationType: {
    readonly RELATED: "related";
    readonly ALTERNATIVE: "alternative";
    readonly PREREQUISITE: "prerequisite";
    readonly ADVANCED: "advanced";
    readonly ECOSYSTEM: "ecosystem";
};
export type RelationTypeValue = (typeof RelationType)[keyof typeof RelationType];
export declare const RELATION_TYPES: ("advanced" | "related" | "alternative" | "prerequisite" | "ecosystem")[];
//# sourceMappingURL=relation-type.d.ts.map