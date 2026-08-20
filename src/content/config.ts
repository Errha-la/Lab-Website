import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

// Shared tag enum used by BOTH the members and papers collections.
// IMPORTANT: keep this slug list unchanged — it is reused by the
// Publications graph, Nav filters, and Team page in later phases.
export const tagEnum = z.enum([
  // domain 研究領域
  'smart-manufacturing', 'defect-detection', 'predictive-maintenance',
  'equipment-health-monitoring', 'digital-twin',
  // domain (interdisciplinary outliers — see 2026-02-xylem-single-cell-spatial-transcriptomics.md
  // and 2025-06-xylem-mechanical-stress-multiomics.md; kept in the same shared enum so these
  // papers still participate in the Publications graph, just as their own distinct cluster)
  'plant-biology',
  // method 研究方法
  'deep-learning', 'machine-learning', 'optimization', 'attention-mechanism',
  'knowledge-distillation', 'meta-heuristics',
  // method (plant-biology papers)
  'single-cell-genomics',
  // topic 主題
  'ai-agent', 'scheduling', 'anomaly-detection', 'llm', 'rag', 'generative-ai',
  // tech 技術
  'yolo', 'knowledge-graph', 'multi-agent-system', 'gan',
  'image-recognition', 'web-development', 'database-management',
  // tech (plant-biology papers)
  'spatial-transcriptomics',
]);

const membersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/members' }),
  schema: z.object({
    name: z.string(),
    name_en: z.string().optional(),
    degree: z.enum(['phd', 'master', 'undergrad']),
    status: z.enum(['current', 'alumni']).default('current'),
    order: z.number().default(99),
    image: z.string().optional(),
    tags: z.array(tagEnum),
    thesis_url: z.string().url().optional(),
    github_url: z.string().url().optional(),
    email: z.string().email().optional(),
  }),
});

const papersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/papers' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.object({
      name: z.string(),
      is_corresponding: z.boolean().default(false),
      member: reference('members').optional(),
    })),
    year: z.number(),
    month: z.number().min(1).max(12),
    type: z.enum(['journal', 'conference', 'other']).default('journal'),
    venue: z.string(),
    tags: z.object({
      method: z.array(tagEnum).default([]),
      topic: z.array(tagEnum).default([]),
      domain: z.array(tagEnum).default([]),
      tech: z.array(tagEnum).default([]),
    }),
    featured: z.boolean().default(false),
    doi_url: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

export const collections = {
  members: membersCollection,
  papers: papersCollection,
};
