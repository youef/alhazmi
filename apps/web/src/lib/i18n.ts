export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function direction(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const dictionary = {
  ar: {
    brand: 'ديوان الحازمي',
    eyebrow: 'منصة تراثية ومجتمعية',
    nav: { home: 'الرئيسية', history: 'تاريخ القبيلة', branches: 'الأفخاذ والعوائل', lineage: 'شجرة النسب', archive: 'الأرشيف' },
    heroKicker: 'الأصالة تجمعنا • والذاكرة تحفظنا',
    heroTitle: 'جذورٌ تجمعنا، وتاريخٌ نحفظه للأجيال',
    heroBody: 'مساحة رقمية لحفظ الموروث العائلي، وتنظيم مصادر الأنساب، وتوثيق الروايات والوثائق بعد مراجعتها، مع احترام خصوصية أفراد القبيلة.',
    browse: 'استكشف الأقسام', exploreLineage: 'شجرة النسب',
    welcome: 'أهلاً بكم في ديوان الحازمي',
    welcomeBody: 'نعمل على بناء مرجع إلكتروني يحفظ الروايات والمخطوطات والسجلات الأسرية، ويُفرّق بين المعلومات الموثقة والبيانات التي لا تزال قيد المراجعة.',
    sections: 'أقسام الديوان',
    branchesTitle: 'الأفخاذ والعوائل', branchesDesc: 'دليل منظم للفروع والأفخاذ والعوائل، تُنشر فيه المعلومات بعد مراجعتها.',
    lineageTitle: 'شجرة النسب', lineageDesc: 'مخطط تفاعلي للأنساب المعتمدة، مع المصادر وحالة التوثيق.',
    archiveTitle: 'الوثائق والموروث', archiveDesc: 'أرشفة الصور والمخطوطات والوثائق التاريخية وفق الأذونات.',
    historyTitle: 'التاريخ والروايات', historyDesc: 'صفحات لتاريخ القبيلة والروايات الموثقة مع مراجعها.',
    coming: 'هذا القسم قيد التجهيز', comingBody: 'تُجهز البيانات والواجهات مع نظام مراجعة وتوثيق. لم تُنشر أي علاقات نسب غير معتمدة.',
    privacy: 'نحترم خصوصية الأفراد؛ لا تُعرض البيانات الشخصية دون صلاحية وموافقة مناسبة.',
    editorial: 'يُراجع المحتوى قبل نشره، ولا تُعد البيانات قيد المراجعة إثباتًا رسميًا للنسب.',
    footer: 'ديوان الحازمي — مبادرة أهلية غير حكومية.',
    returnHome: 'العودة للرئيسية',
    soon: 'قريبًا',
  },
  en: {
    brand: 'Alhazmi Diwan',
    eyebrow: 'Heritage & community platform',
    nav: { home: 'Home', history: 'History', branches: 'Families & branches', lineage: 'Family tree', archive: 'Archive' },
    heroKicker: 'Connected by heritage • Preserved for generations',
    heroTitle: 'Our shared roots, our enduring heritage',
    heroBody: 'A digital space to preserve family heritage, organize genealogy sources, and review historical records while respecting personal privacy.',
    browse: 'Explore sections', exploreLineage: 'Genealogy tree',
    welcome: 'Welcome to Alhazmi Diwan',
    welcomeBody: 'We are building a digital reference for family history and archives, clearly distinguishing verified records from material awaiting review.',
    sections: 'Explore the diwan',
    branchesTitle: 'Families & branches', branchesDesc: 'A carefully reviewed directory of family branches.',
    lineageTitle: 'Genealogy tree', lineageDesc: 'An interactive tree for reviewed relationships, sources, and their verification status.',
    archiveTitle: 'Documents & heritage', archiveDesc: 'Preservation of historical images, manuscripts and documents with appropriate permissions.',
    historyTitle: 'History & accounts', historyDesc: 'Source-attributed accounts of the tribe’s history.',
    coming: 'This section is being prepared', comingBody: 'Data and review workflows are being prepared. Unverified family relationships are not published.',
    privacy: 'Personal records are not disclosed without appropriate permissions and consent.',
    editorial: 'Content is reviewed before publication. Draft genealogical data does not certify ancestry.',
    footer: 'Alhazmi Diwan — an independent community initiative.',
    returnHome: 'Return home',
    soon: 'Coming soon',
  }
} as const;

export function getDictionary(locale: Locale) { return dictionary[locale]; }
