import Link from 'next/link';
import {
  ArrowLeft, ArrowUpLeft, BookOpen, BookMarked, Castle,
  ChevronDown, FileText, Flag, GitBranch, Globe2,
  Landmark, MapPinned, Quote, ScrollText, ShieldCheck, UsersRound,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Bi = { ar: string; en: string };
const t = (ar: boolean, b: Bi) => ar ? b.ar : b.en;

const sources = [
  {
    id: 's1',
    name: {ar: 'حمد الجاسر — معجم قبائل المملكة العربية السعودية',en: 'Hamad Al-Jasser — Dictionary of Saudi Tribes'},
    note: {ar: 'الطبعة الأولى 1401هـ / 1981م، ص 138: تمييز «حازم» الفدعان عن فروع تشترك في الاسم.',en: 'First edition, 1981, p. 138: distinguishes Hazm of the Fad’an from unrelated groups of the same name.'},
    url: 'https://books.islamway.net/1/525_aljasir_mejmqabyil.pdf',
    type: {ar: 'مرجع مطبوع',en: 'Published reference'},
  },
  {
    id: 's2',
    name: {ar: 'وثيقتان عن أصل قبيلة الحازم من الفدعان — إعداد عايد الحصيني',en: 'Two genealogical testimonies — compiled by Aayed Al-Husseini'},
    note: {ar: 'نقل نصي لشهادتين مؤرختين 1404هـ و1407هـ ورواية نسب ومشاش الخنفة، نشر 2008؛ أصل الوثائق يحتاج معاينة.',en: '2008 transcription of testimonies dated 1404/1407 AH and a narrated family account; original documents need independent inspection.'},
    url: 'https://www.bnabar.com/vb/showthread.php?t=1303',
    type: {ar: 'نقل وثائق ورواية',en: 'Transcribed documents'},
  },
  {
    id: 's3',
    name: {ar: 'عبدالله بن عبار — تفرعات قبيلة الحازم من الفدعان',en: 'Abdullah bin Abbar — Branches of Hazm within the Fad’an'},
    note: {ar: 'مناقشة 2011، مع تحديثات لاحقة، تذكر الضوامرة والقريشم والأفخاذ العشرة والأسماء التاريخية للمشيخة.',en: '2011 genealogical exchange, with later edits, listing the two principal divisions, ten branches and historical leadership families.'},
    url: 'https://www.bnabar.com/vb/showthread.php?t=5150',
    type: {ar: 'بحث أنساب منشور',en: 'Genealogical research'},
  },
  {
    id: 's4',
    name: {ar: 'عبدالله بن عبار — السلالات الأسرية للفدعان',en: 'Abdullah bin Abbar — Fad’an Family Lineages'},
    note: {ar: 'تدوين منشور عام 2024 لتسلسل الحازم من الخميس من العقاقرة وتفصيل فروع الدرويش.',en: 'Published in 2024: Hazm’s place under al-Khamis/al-Aqaqirah and several Darwish subdivisions.'},
    url: 'https://bnabar.com/vb/showthread.php?t=13274',
    type: {ar: 'تفصيل أنساب',en: 'Genealogical register'},
  },
  {
    id: 's5',
    name: {ar: 'مجحم بن مهيد — التاريخ السوري المعاصر',en: 'Majham bin Muhaid — Modern Syrian History'},
    note: {ar: 'سيرة موثقة بالمراجع عن الشيخ مجحم بن مهيد، من شيوخ الفدعان، وعضويته في المجلس النيابي السوري.',en: 'A sourced biography of Fad’an Sheikh Majham bin Muhaid and his participation in Syrian parliamentary life.'},
    url: 'https://syrmh.com/2024/12/05/%D9%85%D8%AC%D8%AD%D9%85-%D8%A8%D9%86-%D9%85%D9%87%D9%8A%D8%AF/',
    type: {ar: 'أرشيف تاريخي',en: 'Historical archive'},
  },
  {
    id: 's6',
    name: {ar: 'معهد الشرق — بحث تاريخ بدو عنزة في سورية',en: 'Orient-Institut — Bedouin Syria research'},
    note: {ar: 'بحث أكاديمي عن هجرات مجموعات من عنزة إلى سورية وعلاقاتها بالمجتمع والدولة في القرنين التاسع عشر والعشرين.',en: 'Academic research on Anaza migrations to Syria and social changes in the nineteenth and twentieth centuries.'},
    url: 'https://www.orient-institut.org/research/previous-projects/bedouin-syria-johann-buessow.html',
    type: {ar: 'بحث أكاديمي',en: 'Academic study'},
  },
  {
    id: 's7',
    name: {ar: 'عبدالله بن عبار — توضيح حول نسب قبيلة الحازم (2021)',en: 'Abdullah bin Abbar — Hazm genealogy clarification (2021)'},
    note: {ar: 'مادة بحثية منشورة تستعرض الروايات والشهادات وتذكر وقائع ارتبطت بعرعر. تُعد رواية كاتبها وليست تعدادًا رسميًا للسكان.',en: 'A published genealogical account referring to Hazm-related historical events in Arar; an author’s account, not an official population census.'},
    url: 'https://www.bnabar.com/vb/showthread.php?t=12387',
    type: {ar: 'مقال أنساب وروايات',en: 'Genealogical account'},
  },
];

const divisions = [
  {
    id: 'dhawamir',
    title: {ar: 'الضوامرة',en: 'Al-Dhawamir'},
    subtitle: {ar: 'القسم الأول',en: 'First principal division'},
    clans: [
      ['الدرويش', 'Al-Darwish'], ['الحمد', 'Al-Hamad'],
      ['العجلان', 'Al-Ajlan'], ['الشرهة', 'Al-Sharhah'],
      ['الغافل', 'Al-Ghafil'], ['الجمال', 'Al-Jammal'],
      ['الحصيني', 'Al-Husseini'],
    ],
    sub: {ar: 'ترتبط بعض التفرعات في المخطط الأدق برويضي وسالم؛ ويُذكر الدرويش ضمن الضوامرة مباشرة.',en: 'More detailed registers include Ruwaydi and Salim as intermediate nodes; Darwish is also listed directly under Dhawamir.'},
  },
  {
    id: 'quraishim',
    title: {ar: 'القريشم',en: 'Al-Quraishim'},
    subtitle: {ar: 'القسم الثاني',en: 'Second principal division'},
    clans: [
      ['العماوية', 'Al-Amawiyah'], ['الوريك', 'Al-Wuraik'],
      ['الثوابتة', 'Al-Thawabitah'],
    ],
    sub: {ar: 'تتفرع منها عوائل وأقسام أخرى؛ التفاصيل المعتمدة تُستعرض في دليل شجرة الأنساب.',en: 'These in turn contain further families and sections; consult the reviewed lineage directory for details.'},
  },
];

const notableGroups = [
  {
    title: {ar: 'ابن شرهة',en: 'Ibn Sharhah'},
    type: {ar: 'مشيخة تاريخية في الحازم',en: 'Hazm historical leadership'},
    text: {ar: 'أورد عبدالله بن عبار «ابن شرهة» ضمن شيوخ الحازم في نقله المنشور. وتوجد في المناقشة نفسها اختلافات حول نطاق رئاسة كل فرع، لذلك لا تعرض الصفحة ترتيبًا رسميًا أو شيخًا حاليًا.',en: 'Abdullah bin Abbar names Ibn Sharhah among historical Hazm leadership families. The same discussion contains differences about the scope of authority, so no present-day official hierarchy is asserted.'},
    source: 's3',
  },
  {
    title: {ar: 'ابن أديهم',en: 'Ibn Adihim'},
    type: {ar: 'مشيخة تاريخية في الحازم',en: 'Hazm historical leadership'},
    text: {ar: 'ورد ابن أديهم أيضًا ضمن الشيوخ في رواية ابن عبار. وتورد إحدى الروايات اسم الشيخ باتل بن نومان بن أديهم في إفادة تتعلق بأصل الحازم وروايتهم الموروثة.',en: 'Ibn Adihim is likewise named by Ibn Abbar. A published genealogical testimony names Sheikh Batil bin Numan bin Adihim in an account of Hazm origins.'},
    source: 's2',
  },
  {
    title: {ar: 'الشيخ خالد النوري المهيد',en: 'Sheikh Khalid Al-Nuri Al-Muhaid'},
    type: {ar: 'شهادة من مشيخة الفدعان',en: 'Testimony associated with Fad’an leadership'},
    text: {ar: 'ينسب النقل المنشور إليه خطابًا مؤرخًا في 7 جمادى الأولى 1404هـ موجّهًا إلى أمير الجوف آنذاك يذكر فيه صلة الحازم بالفدعان. هذا نقل للوثيقة لا تحقيق لصورتها الأصلية.',en: 'A published transcription attributes to him a letter dated 7 Jumada I 1404 AH about Hazm’s connection to the Fad’an. The original letter has not been independently authenticated here.'},
    source: 's2',
  },
  {
    title: {ar: 'الشيخ مجحم بن تركي آل مهيد',en: 'Sheikh Majham bin Turki Al-Muhaid'},
    type: {ar: 'من شيوخ الفدعان عامةً',en: 'Leadership of the broader Fad’an'},
    text: {ar: 'شخصية تاريخية من شيوخ الفدعان، لا يُقدّم بوصفه شيخًا خاصًا للحازم. يذكر «التاريخ السوري المعاصر» انتخابه في الجمعية التأسيسية السورية عام 1928م ومجلس النواب عام 1936م.',en: 'A historical Fad’an leader, not described here as a Hazm-specific sheikh. Modern Syrian History records his 1928 and 1936 parliamentary roles.'},
    source: 's5',
  },
  {
    title: {ar: 'الباحث عايد بن ريشود الحصيني الحازمي',en: 'Researcher Aayed bin Raishud Al-Husseini Al-Hazmi'},
    type: {ar: 'جمع الروايات والوثائق',en: 'Genealogical document collection'},
    text: {ar: 'ورد اسمه في إعداد مادة «وثيقتان عن أصل قبيلة الحازم» المنشورة عام 2008، وهي من المواد التي تتيح للباحثين الرجوع إلى نصوص الشهادات والرواية الأسرية.',en: 'Credited as the compiler of the 2008 publication “Two documents on the origin of Hazm”, containing testimony transcriptions and a family narrative.'},
    source: 's2',
  },
  {
    title: {ar: 'حسن الربح',en: 'Hassan Al-Ribh'},
    type: {ar: 'اسم ورد ضمن فرسان الحازم في تدوين 2024',en: 'Named among Hazm horsemen in a 2024 genealogical record'},
    text: {ar: 'يذكره عبدالله بن عبار ضمن أسماء فرسان الحازم. تُعرض المعلومة بنسبتها إلى صاحب التدوين، دون إضافة تواريخ أو أدوار لم تُتحقق من مصادر مستقلة.',en: 'Abdullah bin Abbar lists him among Hazm horsemen. This is attributed to the compiler, without invented dates or independently unverified claims.'},
    source: 's4',
  },
  {
    title: {ar: 'بصيص بن خضر',en: 'Busais bin Khidr'},
    type: {ar: 'اسم ورد ضمن فرسان الحازم في تدوين 2024',en: 'Named among Hazm horsemen in a 2024 genealogical record'},
    text: {ar: 'ترد تسميته في السجل المنشور ضمن الأسماء المرتبطة بالفرسان، ويُلحق به لقب «راعي جديعا» في المصدر. لا تتوفر في المصادر المستخدمة ترجمة مستقلة مفصلة له.',en: 'Recorded among the historical horsemen with the epithet “Ra‘i Jaday‘a”. No separate, independently verified biography is available in the cited material.'},
    source: 's4',
  },
  {
    title: {ar: 'فهد بطي المرسال',en: 'Fahd Batti Al-Mirsal'},
    type: {ar: 'اسم تاريخي ورد في توثيق الفدعان',en: 'Name recorded in Fad’an genealogical literature'},
    text: {ar: 'أورده عبدالله بن عبار في قائمة فرسان الحازم المشاركين في توحيد المملكة. هذه شهادة من مؤلف التدوين، ولم تُثبت هنا بتوثيق أرشيفي مستقل.',en: 'Abdullah bin Abbar includes him in a list of Hazm horsemen associated with Saudi unification. This claim remains attributed to the published genealogical record.'},
    source: 's4',
  },
];

const places = [
  {
    title: {ar: 'الجزيرة العربية وخيبر',en: 'Arabian Peninsula and Khaybar'},
    category: {ar: 'الإطار التاريخي العام',en: 'Wider historical context'},
    text: {ar: 'ترتبط روايات قبيلة عنزة بتاريخ شمال الحجاز ونجد، وتظهر خيبر في الرواية الموروثة عن حازم. هذا نطاق تاريخي، وليس إحصاءً لمنازل جميع الأسر.',en: 'Anaza history is linked to northern Hijaz and Najd; Khaybar appears in the transmitted Hazm story. This is historical context, not a census of households.'},
    source: 's2',
  },
  {
    title: {ar: 'الجوف والخنفة قرب دومة الجندل',en: 'Al-Jawf and Al-Khanfah near Dumat Al-Jandal'},
    category: {ar: 'رواية موضع تاريخي',en: 'Location in oral history'},
    text: {ar: 'تذكر الرواية المتداولة انتقالًا ارتبط بالخنفة ومشاش العود جنوب دومة الجندل. يُعرض هذا بوصفه رواية أسرية منقولة، ولا نحدد موضع قبر أو حدود ملكية.',en: 'The transmitted family account mentions Al-Khanfah and Mashash Al-Oud south of Dumat Al-Jandal. It remains an attributed narrative, not a verified grave site or land claim.'},
    source: 's2',
  },
  {
    title: {ar: 'بادية سورية والفرات',en: 'Syrian steppe and the Euphrates'},
    category: {ar: 'انتشار تاريخي للفدعان وعنزة',en: 'Historical Fad’an / Anaza presence'},
    text: {ar: 'تتناول دراسات عن عنزة والفدعان انتقال مجموعات من البادية شمالًا وتاريخ حضورها في سورية ومنطقة الفرات. لا يلزم من ذلك أن كل أفخاذ الحازم سكنت تلك المواضع.',en: 'Studies of Anaza and the Fad’an discuss northward migrations into Syria and the Euphrates region; this does not establish residence there for every Hazm branch.'},
    source: 's6',
  },
  {
    title: {ar: 'الاستقرار المعاصر',en: 'Modern settlement'},
    category: {ar: 'يحتاج توثيقًا ميدانيًا',en: 'Requires verified local records'},
    text: {ar: 'تذكر مادة نسب منشورة صلة تاريخية لأبناء الحازم بمدينة عرعر في سياق استقبال أحد شيوخ الفدعان، وترد الجوف في الروايات الأقدم. لا تتوفر إحصائية حديثة موثقة لعدد الأسر أو انتشارها في جميع المدن.',en: 'A published genealogical account refers to Hazm families in Arar in a historical encounter with a Fad’an sheikh; older family narratives also mention Al-Jawf. No verified modern city-by-city population count is established.'},
    source: 's7',
  },
];

const chapters = [
  ['origin', {ar:'الأصل والنسب',en:'Origin and descent'}],
  ['family', {ar:'الأفخاذ والعوائل',en:'Branches and families'}],
  ['story', {ar:'الرواية والتاريخ',en:'Heritage and history'}],
  ['chiefs', {ar:'الشيوخ والشخصيات',en:'Historical figures'}],
  ['regions', {ar:'المواطن والانتشار',en:'Regions and movement'}],
  ['sources', {ar:'المصادر والتوثيق',en:'References'}],
] as const;

function SourceRef({ id, ar }: {id: string; ar: boolean}) {
  const src = sources.find(source => source.id === id);
  return <a className="hh-cite" href={'#source-' + id} aria-label={(ar ? 'المرجع: ' : 'Reference: ') + t(ar, src!.name)}>
    <FileText size={13} aria-hidden="true"/> {ar ? 'المصدر' : 'Source'}
  </a>;
}

function Heading({eyebrow, title, description}: {eyebrow: string;title:string;description?:string}) {
  return <div className="hh-heading"><span className="hh-eyebrow">{eyebrow}</span><h2>{title}</h2>
    {description && <p>{description}</p>}</div>;
}

export function HistoryContent({locale}:{locale:Locale}) {
  const ar = locale === 'ar';
  const site = '/' + locale;
  return <div className="hazm-history">
    <nav className="hh-breadcrumb" aria-label={ar ? 'مسار الصفحة' : 'Breadcrumb'}>
      <Link href={site + '/'}>{ar ? 'ديوان الحازمي' : 'Alhazmi Diwan'}</Link>
      <span aria-hidden="true">/</span><span aria-current="page">{ar ? 'تاريخ الحازم' : 'History of the Hazm'}</span>
    </nav>

    <section className="hh-hero" aria-labelledby="hh-title">
      <div className="hh-hero-pattern" aria-hidden="true"><span/><span/><span/></div>
      <div className="hh-hero-body">
        <div className="hh-kicker"><ScrollText size={16} aria-hidden="true"/>
          {ar ? 'ديوان الأنساب والموروث · ملف تاريخي' : 'Ancestry & Heritage · Historical Profile'}</div>
        <h1 id="hh-title">{ar ? <>قبيلة <em>الحازم</em><small>من الفدعان من عنزة</small></> : <>The <em>Hazm</em><small>of the Fad’an — Anaza</small></>}</h1>
        <p>{ar
          ? 'من الجذور والروايات إلى تفرعات الأفخاذ والشخصيات التاريخية؛ صفحة تراثية تستند إلى مراجع منشورة وتوضح مواضع الاختلاف وما يحتاج إلى استكمال التوثيق.'
          : 'From genealogy and oral heritage to branches and historical figures: a referenced account distinguishing documented information from attributed narratives.'}</p>
        <div className="hh-hero-tags">
          <span><ShieldCheck size={15} aria-hidden="true"/>{ar ? 'نسب موثّق في مرجع مطبوع' : 'Recorded in a published reference'}</span>
          <span><BookOpen size={15} aria-hidden="true"/>{ar ? 'المصادر مذكورة' : 'Sources provided'}</span>
        </div>
        <div className="hh-hero-buttons">
          <a href="#origin" className="hh-cta">{ar ? 'اكتشف تاريخنا' : 'Explore the history'}<ArrowLeft size={18}/></a>
          <Link className="hh-cta hh-cta-outline" href={site + '/lineage/'}>{ar ? 'تصفح شجرة النسب' : 'View lineage tree'}<GitBranch size={18}/></Link>
        </div>
      </div>
      <div className="hh-hero-emblem" aria-hidden="true">
        <div className="hh-ring hh-ring-outer"/><div className="hh-ring hh-ring-inner"/>
        <div className="hh-emblem-center"><Landmark size={58} strokeWidth={1.3}/><span>{ar ? 'حازم' : 'HAZM'}</span></div>
      </div>
    </section>

    <div className="hh-facts" aria-label={ar ? 'لمحة سريعة' : 'Overview'}>
      <div><span><Globe2 size={19}/></span><small>{ar ? 'القبيلة الأم' : 'Parent tribe'}</small><strong>{ar ? 'عنزة' : 'Anaza'}</strong></div>
      <div><span><UsersRound size={19}/></span><small>{ar ? 'الفرع' : 'Subtribe'}</small><strong>{ar ? 'الفدعان' : 'Fad’an'}</strong></div>
      <div><span><GitBranch size={19}/></span><small>{ar ? 'القسمان الرئيسيان' : 'Principal divisions'}</small><strong>{ar ? 'الضوامرة · القريشم' : 'Dhawamir · Quraishim'}</strong></div>
      <div><span><BookMarked size={19}/></span><small>{ar ? 'الأفخاذ الأساسية المذكورة' : 'Listed main branches'}</small><strong>{ar ? '١٠ أفخاذ' : '10 branches'}</strong></div>
    </div>

    <nav className="hh-index" aria-label={ar ? 'أقسام الملف التاريخي' : 'Historical page sections'}>
      {chapters.map(([id,label],i) => <a key={id} href={'#' + id}>
        <span>{String(i+1).padStart(2,'0')}</span>{t(ar,label)}</a>)}
    </nav>

    <section id="origin" className="hh-section">
      <Heading eyebrow={ar ? '01 / هوية وانتماء' : '01 / Identity & genealogy'}
        title={ar ? 'الجذور والنسب' : 'Ancestry and origins'}
        description={ar ? 'التمييز بين تشابه الأسماء والانتساب المنقول في المصادر هو أساس التوثيق الصحيح.' : 'Proper historical documentation starts by distinguishing similar names and carefully attributed lineages.'}/>
      <div className="hh-origin-grid">
        <article className="hh-paper hh-prose">
          <span className="hh-paper-icon"><ScrollText size={25}/></span>
          <h3>{ar ? 'الحازم من الفدعان' : 'Hazm of the Fad’an'}</h3>
          <p>{ar
            ? 'ذكر حمد الجاسر في معجم قبائل المملكة العربية السعودية «حازم» ضمن الفدعان من عنزة. وهذا تمييز مهم؛ إذ يورد المعجم مجموعات أخرى باسم «حازم» أو «الحازم» تنتسب إلى أصول مختلفة، فلا يصح تعميم نسبة واحدة على كل حامل للاسم.'
            : 'Hamad Al-Jasser’s Dictionary of Saudi Tribes records “Hazm” among the Fad’an of Anaza. The same reference lists other groups named Hazm/Al-Hazm with distinct affiliations, so the surname alone does not establish shared descent.'}</p>
          <SourceRef id="s1" ar={ar}/>
        </article>
        <article className="hh-lineage-panel">
          <h3>{ar ? 'التسلسل الوارد في المصادر' : 'Published genealogical sequence'}</h3>
          <div className="hh-lineage-steps">
            {(ar
              ? ['عنزة','بشر','ضنا عبيد','الفدعان','ضنا محمد (الولد)','ضنا فريض','العقاقرة','الخميس','الحازم']
              : ['Anaza','Bishr','Dhina Ubaid','Fad’an','Dhina Muhammad (Al-Walad)','Dhina Farid','Al-Aqaqirah','Al-Khamis','Hazm']
            ).map((name,i,all)=><div key={name} className={'hh-lineage-step' + (i === all.length-1 ? ' is-last' : '')}>
              <span>{i+1}</span><strong>{name}</strong>{i<all.length-1&&<ChevronDown size={15}/>}
            </div>)}
          </div>
          <p>{ar ? 'ترتيب مأخوذ من روايات الأنساب المنشورة؛ لا تُستنتج منه صلة فردية دون سجل مستقل.' : 'Compiled from published genealogical accounts, not proof of any individual family relationship.'}</p>
          <SourceRef id="s2" ar={ar}/><SourceRef id="s4" ar={ar}/>
        </article>
      </div>
    </section>

    <section id="family" className="hh-section">
      <Heading eyebrow={ar ? '02 / وحدات النسب' : '02 / Genealogical branches'}
        title={ar ? 'أفخاذ الحازم وعوائلهم' : 'The main Hazm divisions'}
        description={ar ? 'يُذكر في المصادر قسمان رئيسيان يتفرع منهما عشرة أفخاذ؛ وقد تختلف بعض التسميات الوسيطة بحسب مستوى التفصيل.' : 'Sources describe two principal divisions and ten main branches; intermediate names may vary with the level of detail.'}/>
      <div className="hh-divisions">
        {divisions.map((d,i)=><article className="hh-division" key={d.id}>
          <div className="hh-division-head"><span className="hh-division-no">0{i+1}</span>
            <div><small>{t(ar,d.subtitle)}</small><h3>{t(ar,d.title)}</h3></div>
            <span className="hh-division-badge">{d.clans.length} {ar ? 'أفخاذ' : 'branches'}</span></div>
          <div className="hh-clan-list">{d.clans.map(([arabic, english])=><span key={arabic}><GitBranch size={14} aria-hidden="true"/>{ar ? arabic : english}</span>)}</div>
          <p>{t(ar,d.sub)}</p><SourceRef id="s3" ar={ar}/>
        </article>)}
      </div>
      <div className="hh-highlight-note">
        <div className="hh-note-icon"><FolderIcon/></div>
        <div><strong>{ar ? 'تفصيل داخل فخذ الدرويش' : 'A closer look at Al-Darwish'}</strong>
          <p>{ar ? 'تورد الروايات فروعًا منها: العلي، الحسن، السعد، البخيتان، الخضر. ومن تفرعات الحسن: الشجارين (المطر)، والحماد (الجميل)، والغبوب، والخلف، والمحمد.' : 'Recorded subdivisions include Al-Ali, Al-Hasan, Al-Saad, Al-Bukhaitan and Al-Khidr. Al-Hasan includes Al-Shajarin (Al-Matar), Al-Hamad (Al-Jamil), Al-Ghubub, Al-Khalaf and Al-Muhammad.'}</p>
          <SourceRef id="s3" ar={ar}/><SourceRef id="s4" ar={ar}/>
        </div>
      </div>
      <div className="hh-section-actions">
        <Link href={site+'/lineage/'}>{ar ? 'استعرض شجرة الوحدات المعتمدة كاملة' : 'Browse the fully reviewed public tree'} <ArrowLeft size={18}/></Link>
        <Link href={site+'/branches/'}>{ar ? 'دليل الأفخاذ والعوائل' : 'Branch and family directory'} <ArrowUpLeft size={18}/></Link>
      </div>
    </section>

    <section id="story" className="hh-section hh-story-section">
      <Heading eyebrow={ar ? '03 / الرواية والموروث' : '03 / Oral heritage'}
        title={ar ? 'من الرواية إلى السجل التاريخي' : 'Between oral memory and written history'}
        description={ar ? 'الرواية المتوارثة جزء من الذاكرة الاجتماعية، ويجب الفصل بينها وبين الوقائع المؤرخة والمستندات الأصلية.' : 'Inherited oral narratives are part of communal memory; they must be distinguished from authenticated dated records.'}/>
      <div className="hh-story-grid">
        <article className="hh-story-main">
          <div className="hh-story-quote"><Quote size={28}/><span>{ar ? 'رواية منقولة — ليست حقيقة تاريخية محققة' : 'Attributed narrative — not independently established history'}</span></div>
          <h3>{ar ? 'حكاية الجد حازم' : 'The account of ancestor Hazm'}</h3>
          <p>{ar
            ? 'تحكي رواية منشورة عن حازم بن خميس بن فريض، وعن انتقاله بعد خلاف عائلي، ثم محاولة اللحاق بقومه. وتذكر الرواية الخنفة ومشاش العود قرب دومة الجندل، وأن قصة الاستقرار اللاحق انتقلت عبر كبار العائلة. نورد خلاصتها بصفتها رواية موروثة لا بوصفها حادثة ثبت تاريخها وتفاصيلها بوثائق مستقلة.'
            : 'A published family account describes Hazm bin Khamis bin Farid, his journey after a family dispute, and an attempted reunion with his relatives. It mentions Al-Khanfah and Mashash Al-Oud near Dumat Al-Jandal. This is presented as an oral account, not as an independently authenticated sequence of events.'}</p>
          <SourceRef id="s2" ar={ar}/>
        </article>
        <div className="hh-milestones">
          <article><span>01</span><h3>{ar ? 'النسب في الكتابات' : 'Recorded genealogy'}</h3><p>{ar ? 'ذكر الحازم من الفدعان في معجم حمد الجاسر الصادر سنة 1981م.' : 'Al-Jasser’s 1981 reference includes Hazm among the Fad’an.'}</p><SourceRef id="s1" ar={ar}/></article>
          <article><span>02</span><h3>{ar ? 'الشهادات المنقولة' : 'Attributed testimonies'}</h3><p>{ar ? 'تُنسب شهادتان إلى عامي 1404هـ و1407هـ وتتعلقان بصلة الحازم بالفدعان.' : 'Two attributed genealogical testimonies are dated 1404 and 1407 AH.'}</p><SourceRef id="s2" ar={ar}/></article>
          <article><span>03</span><h3>{ar ? 'تدوين الفروع' : 'Documenting branches'}</h3><p>{ar ? 'عرض منشور 2011 ومادة 2024 تفرعات متعددة للعشيرة وأفخاذها.' : 'Genealogical posts from 2011 and 2024 document the branch structure.'}</p><SourceRef id="s3" ar={ar}/></article>
        </div>
      </div>
    </section>

    <section id="chiefs" className="hh-section">
      <Heading eyebrow={ar ? '04 / الأعلام والمشيخة' : '04 / Historical figures'}
        title={ar ? 'الشيوخ والشخصيات المذكورة في المصادر' : 'Sheikhs and figures in the sources'}
        description={ar ? 'الأسماء التالية موثقة الذكر في مصادر منشورة، لكن الاختلاف التاريخي في المراتب والأدوار لا يسمح بتسمية شيخ حالي للعموم دون سند حديث صريح.' : 'These people or leadership houses appear in published sources; historical disputes mean no present-day tribal office is asserted without specific recent evidence.'}/>
      <div className="hh-people-grid">
        {notableGroups.map((person,i)=><article className="hh-person" key={i}>
          <div className="hh-person-top"><div className="hh-person-mark"><UsersRound size={25}/></div><span>{String(i+1).padStart(2,'0')}</span></div>
          <small>{t(ar,person.type)}</small><h3>{t(ar,person.title)}</h3>
          <p>{t(ar,person.text)}</p><SourceRef id={person.source} ar={ar}/>
        </article>)}
      </div>
      <p className="hh-caution"><ShieldCheck size={19} aria-hidden="true"/>{ar
        ? 'تنبيه: المناقشات المنشورة تتضمن روايات مختلفة حول نطاق بعض المشيخات. توثيق الأسماء هنا لا يمنح صفة رسمية حالية، ولا يفضّل فرعًا على آخر.'
        : 'Note: published discussions differ over the jurisdiction of certain historical leadership houses. Listing names here is not a current endorsement or official appointment.'}</p>
    </section>

    <section id="regions" className="hh-section">
      <Heading eyebrow={ar ? '05 / الموطن والامتداد' : '05 / Places and historical movement'}
        title={ar ? 'المواطن التاريخية ومناطق الانتشار' : 'Historical places and movements'}
        description={ar ? 'تميّز هذه الصفحة بين روايات الحازم الخاصة وبين التاريخ الأوسع للفدعان وعنزة، ولا تُقدّم تعدادًا سكانيًا.' : 'This section separates Hazm family narratives from the broader geography of the Fad’an and Anaza; it does not present a population census.'}/>
      <div className="hh-regions">{places.map((place,i)=><article key={i}>
        <div className="hh-region-symbol"><MapPinned size={23}/></div><div><small>{t(ar,place.category)}</small>
        <h3>{t(ar,place.title)}</h3><p>{t(ar,place.text)}</p><SourceRef id={place.source} ar={ar}/></div>
      </article>)}</div>
    </section>

    <section id="sources" className="hh-section">
      <Heading eyebrow={ar ? '06 / التوثيق والمراجع' : '06 / Sources and editorial method'}
        title={ar ? 'المراجع التي بُنيت عليها الصفحة' : 'References behind this page'}
        description={ar ? 'المصدر المنشور يُذكر باسمه وتاريخه ونوعه؛ نقل الوثيقة أو الرواية لا يعني التحقق من أصلها.' : 'Each source is identified by type; a transcription or an oral account is not equivalent to authenticating the underlying document.'}/>
      <div className="hh-sources">{sources.map((source,i)=><article id={'source-'+source.id} key={source.id}>
        <span className="hh-source-index">{String(i+1).padStart(2,'0')}</span><div>
          <span className="hh-source-type">{t(ar,source.type)}</span>
          <h3>{t(ar,source.name)}</h3><p>{t(ar,source.note)}</p>
          <a href={source.url} target="_blank" rel="noopener noreferrer">{ar ? 'فتح المرجع الأصلي' : 'Open source'} <ArrowUpLeft size={15}/></a>
        </div></article>)}</div>
      <details className="hh-edit-note"><summary>{ar ? 'سياسة تحرير النسب والأسماء والشخصيات' : 'Editorial policy for genealogies and names'}<ChevronDown size={17}/></summary>
        <p>{ar
          ? 'الصفحة منصة أهلية وليست سجلًا رسميًا. لا يُعمم اسم الحازمي على كل من يحمله؛ تُراجع مصادر كل فرع مستقلاً. الشخصيات المعاصرة لا تُضاف إلا بمعلومات عامة موثوقة وملائمة للخصوصية، ولا يُعرض نسب الأحياء أو بيانات أسرهم الشخصية دون إذن. تقبل الملاحظات عبر إجراءات الديوان الإدارية قبل اعتماد تعديل تاريخي.'
          : 'This is an independent heritage page, not an official registry. The surname is not proof of ancestry; each line must be assessed individually. Living people and personal family details require suitable permission and credible public documentation before publication.'}</p></details>
    </section>

    <section className="hh-bottom-cta">
      <div><Flag size={30}/><span>{ar ? 'حفظ الموروث مسؤولية الأجيال' : 'Preserving heritage for future generations'}</span>
        <h2>{ar ? 'من الذاكرة إلى شجرةٍ موثّقة' : 'From memory to a reviewed family tree'}</h2>
        <p>{ar ? 'واصل اكتشاف الأفخاذ والعوائل في شجرة الديوان، مع فصل التاريخ العام عن بيانات الأشخاص الخاصة.' : 'Continue exploring reviewed branches and families, while keeping personal records private.'}</p></div>
      <Link href={site+'/lineage/'}>{ar ? 'استكشف شجرة القبيلة' : 'Explore the lineage tree'} <ArrowLeft size={18}/></Link>
    </section>
  </div>;
}

function FolderIcon(){return <Castle size={24} aria-hidden="true"/>;}
