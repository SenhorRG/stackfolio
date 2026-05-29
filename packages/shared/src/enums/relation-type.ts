export const RelationType = {
  RELATED: 'related',
  ALTERNATIVE: 'alternative',
  PREREQUISITE: 'prerequisite',
  ADVANCED: 'advanced',
  ECOSYSTEM: 'ecosystem',
} as const;

export type RelationTypeValue =
  (typeof RelationType)[keyof typeof RelationType];

export const RELATION_TYPES = Object.values(RelationType);
