// Shared tag lookup table — used by the TagBadge component, Nav filters,
// and the Publications graph legend in later phases.
// Slugs here MUST stay in sync with the tagEnum in `src/content/config.ts`.

export type TagCategory = 'domain' | 'method' | 'topic' | 'tech';

export interface TagInfo {
  slug: string;
  zh: string;
  en: string;
  category: TagCategory;
}

export const TAGS: Record<string, TagInfo> = {
  // domain 研究領域
  'smart-manufacturing': { slug: 'smart-manufacturing', zh: '智慧製造', en: 'Smart Manufacturing', category: 'domain' },
  'defect-detection': { slug: 'defect-detection', zh: '瑕疵檢測', en: 'Defect Detection', category: 'domain' },
  'predictive-maintenance': { slug: 'predictive-maintenance', zh: '預測性維修', en: 'Predictive Maintenance', category: 'domain' },
  'equipment-health-monitoring': { slug: 'equipment-health-monitoring', zh: '設備健康監測', en: 'Equipment Health Monitoring', category: 'domain' },
  'digital-twin': { slug: 'digital-twin', zh: '數位雙生', en: 'Digital Twin', category: 'domain' },
  'plant-biology': { slug: 'plant-biology', zh: '植物生物學', en: 'Plant Biology', category: 'domain' },

  // method 研究方法
  'deep-learning': { slug: 'deep-learning', zh: '深度學習', en: 'Deep Learning', category: 'method' },
  'machine-learning': { slug: 'machine-learning', zh: '機器學習', en: 'Machine Learning', category: 'method' },
  'optimization': { slug: 'optimization', zh: '最佳化', en: 'Optimization', category: 'method' },
  'attention-mechanism': { slug: 'attention-mechanism', zh: '注意力機制', en: 'Attention Mechanism', category: 'method' },
  'knowledge-distillation': { slug: 'knowledge-distillation', zh: '知識蒸餾', en: 'Knowledge Distillation', category: 'method' },
  'meta-heuristics': { slug: 'meta-heuristics', zh: '啟發式演算法', en: 'Meta-heuristics', category: 'method' },
  'single-cell-genomics': { slug: 'single-cell-genomics', zh: '單細胞基因體學', en: 'Single-Cell Genomics', category: 'method' },

  // topic 主題
  'ai-agent': { slug: 'ai-agent', zh: 'AI Agent', en: 'AI Agent', category: 'topic' },
  'scheduling': { slug: 'scheduling', zh: '排程', en: 'Scheduling', category: 'topic' },
  'anomaly-detection': { slug: 'anomaly-detection', zh: '異常偵測', en: 'Anomaly Detection', category: 'topic' },
  'llm': { slug: 'llm', zh: '大型語言模型', en: 'LLM', category: 'topic' },
  'rag': { slug: 'rag', zh: '檢索增強生成', en: 'RAG', category: 'topic' },
  'generative-ai': { slug: 'generative-ai', zh: '生成式 AI', en: 'Generative AI', category: 'topic' },

  // tech 技術
  'yolo': { slug: 'yolo', zh: 'YOLO', en: 'YOLO', category: 'tech' },
  'knowledge-graph': { slug: 'knowledge-graph', zh: '知識圖譜', en: 'Knowledge Graph', category: 'tech' },
  'multi-agent-system': { slug: 'multi-agent-system', zh: '多代理系統', en: 'Multi-Agent System', category: 'tech' },
  'gan': { slug: 'gan', zh: '生成對抗網路', en: 'GAN', category: 'tech' },
  'image-recognition': { slug: 'image-recognition', zh: '影像識別', en: 'Image Recognition', category: 'tech' },
  'web-development': { slug: 'web-development', zh: '網頁設計', en: 'Web Development', category: 'tech' },
  'database-management': { slug: 'database-management', zh: '資料庫管理', en: 'Database Management', category: 'tech' },
  'spatial-transcriptomics': { slug: 'spatial-transcriptomics', zh: '空間轉錄體學', en: 'Spatial Transcriptomics', category: 'tech' },
};

export const CATEGORY_COLORS: Record<TagCategory, string> = {
  domain: 'bg-blue-100 text-blue-800 border-blue-300',
  method: 'bg-green-100 text-green-800 border-green-300',
  topic: 'bg-purple-100 text-purple-800 border-purple-300',
  tech: 'bg-amber-100 text-amber-800 border-amber-300',
};
