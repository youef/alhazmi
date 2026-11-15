# المعمارية والمهارات والخطة التقنية

## تقنيات مقترحة
- Web: Next.js + TypeScript + React، تصميم RTL، Tailwind CSS، مكونات سهلة الوصول.
- شجرة النسب: React Flow أو Cytoscape.js مع virtualization / collapsible nodes، وإمكانية طباعة SVG/PDF.
- Backend: مسارات خادم Next.js أو API مستقل (عقد الخدمة أولًا) مع Supabase Auth وPostgreSQL.
- Storage: Supabase Storage private buckets والروابط الموقعة.
- Search: تطبيع عربي، PostgreSQL trigram/full-text (مخطط مستقبلًا)، وفهارس ومراقبة أداء.
- CI: GitHub Actions (lint/typecheck/unit/integration/RLS tests) دون أسرار في ملفات المشروع.
- Observability: logs بدون بيانات حساسة، تقارير أخطاء ومراقبة زمن الاستجابة.
- مدفوعات التكافل مستقبلًا عبر مقدم معتمد فقط، والمشروع لا يخزّن بيانات بطاقات الدفع.

## وحدات الكود المستقبلية
`apps/web` واجهة الموقع،
`packages/kinship` حاسبة القرابة،
`packages/ui` نظام التصميم،
`supabase/migrations` قاعدة البيانات،
`tests/security` اختبارات صلاحيات،
`docs` القرارات والمواصفات.

## المهارات المطلوبة
React/TypeScript, UI/UX RTL, PostgreSQL SQL والمخططات التكرارية, Supabase RLS/Auth,
Graph Algorithms (BFS/DFS/LCA), Data Modeling, Search Arabic NLP,
Document Workflow, Cryptography/KMS, Privacy Engineering, Testing, DevOps,
Accessibility, Archival metadata, Financial ledgers/audit accounting.

## واجهات API المخططة (ليست مطبقة بعد)
GET /api/people?query=
GET /api/people/:id
GET /api/people/:id/tree?ancestors=4&descendants=5
GET /api/kinship?from=:id&to=:id
POST /api/requests (authenticated)
POST /api/requests/:id/review (reviewer)
GET /api/archive
GET /api/welfare/reports (welfare_officer)
GET /api/admin/audit (authorized auditor)

## حالات اختبار حرجة
- طفل من زوجة ثانية، وأخت غير شقيقة من الأم، وزوج سابق للأم.
- طرف متوفى، نسب متنازع عليه، وأب غير معروف، وزواج غير مؤرخ.
- منع عبور نسب دوري، منع رؤية بيانات طفل من مشرف غير مفوض.
- حجب أسماء وبيانات المخفيين حتى في البحث والتعداد وحاسبة القرابة.
- عدم تكرار حدث بعد إعادة إرسال الطلب، وعدم تعديل سجل تدقيق قديم.
