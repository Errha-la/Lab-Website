// Site-wide constants for the lab website.

export const SITE_TITLE_ZH = '先進製程與設備智能輔助實驗室';
export const SITE_TITLE_EN = 'Advanced Process Control and Intelligent Equipment Laboratory';

export const SITE_DESCRIPTION_ZH =
  '本實驗室以 AI Agent 與數位雙生技術為核心，融合工業知識與先進控制，致力打造自主決策與人機協作的閉環智慧製造創新中心。';
export const SITE_DESCRIPTION_EN =
  'Centered on AI Agents and Digital Twins, driving closed-loop smart manufacturing through autonomous decision-making and human–AI collaboration.';

export const CONTACT_EMAIL = 'zaira4edu@gmail.com';

export const ADDRESS_ZH = '235307 新北市中和區工專路111號 臺灣科技大學 華夏校區教學大樓2樓C219';
export const ADDRESS_EN =
  'General Education Building 2F C2, No. 111, Gongzhuan Rd., Zhonghe Dist., New Taipei City 235307, Taiwan (R.O.C.)';

export const NAV_LINKS = [
  { href: '/', zh: '首頁', en: 'Home' },
  { href: '/about', zh: '關於我們', en: 'About' },
  { href: '/professor', zh: '指導教授', en: 'Professor' },
  { href: '/team', zh: '團隊成員', en: 'Team' },
  { href: '/publications', zh: '研究成果', en: 'Publications' },
  { href: '/contact', zh: '聯絡我們', en: 'Contact' },
];

// Kept separate from NAV_LINKS since Nav.astro (built in a later phase) must
// render it as a visually distinct, non-collapsed CTA button, especially on mobile.
export const JOIN_US_LINK = { href: '/join-us', zh: '加入我們', en: 'Join Us' };

export const RESEARCH_PILLARS = [
  {
    title_zh: 'AI Agent 智慧代理人與決策支援',
    title_en: 'AI Agent & Decision Support',
    desc_zh:
      '將大型語言模型（LLM）、最佳化與工業知識（SOP／規範／設備參數）融合為可執行的決策單元，透過任務分解、工具調度、推理驗證與人機協作，實現從「被動分析」走向「主動決策支援」的閉環式智慧製造。',
    desc_en:
      'Developing AI agent applications that integrate large language models (LLMs), optimization methods, and industrial information systems to enable autonomous decision-making and collaborative problem solving — encompassing agent architectures, multi-agent coordination, task planning, tool integration, and human–AI collaboration.',
  },
  {
    title_zh: '數位雙生與實體場域導入',
    title_en: 'Digital Twin & Real-World Deployment',
    desc_zh:
      '我們透過與業界的緊密合作，將數位雙生、流程優化與多代理協作等研究成果導入真實場域，旨在成為先進控制與智慧製造的頂尖創新中心。',
    desc_en:
      'Through close collaboration with industry, we bring digital twin, process optimization, and multi-agent coordination research into real-world deployment, aiming to become a leading innovation center for advanced control and smart manufacturing.',
  },
  {
    title_zh: '先進控制與閉環智慧製造',
    title_en: 'Advanced Control & Closed-loop Manufacturing',
    desc_zh:
      '本實驗室整合了製程控制理論、智能設備設計與 AI 技術，致力於解決現代製造業對高精度、高效率的挑戰，並應用於智慧排程、瑕疵檢測、預測性維修與知識化管理等場域，整合 MES、ERP、PLM 與 IoT 平台的即時資料。',
    desc_en:
      "Combining traditional process control theory with intelligent equipment design and AI technology to address the manufacturing industry's demand for high precision and high efficiency, with applications in intelligent scheduling, defect detection, predictive maintenance, and knowledge-based management using real-time data from MES, ERP, PLM, and IoT platforms.",
  },
];
