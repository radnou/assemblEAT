import type { Metadata } from 'next';
import { CalendarDays, Shield, ChefHat, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AssemblEat — Planifiez vos repas avec le Nutri-Score',
  description:
    'Générez votre planning de repas équilibrés, guidé par le Nutri-Score. Adapté à vos goûts. Gratuit.',
  openGraph: {
    title: 'AssemblEat — Planifiez vos repas avec le Nutri-Score',
    description: 'Planning repas + Nutri-Score + batch cook. Gratuit.',
    url: 'https://assembleat.app',
    siteName: 'AssemblEat',
    locale: 'fr_FR',
    type: 'website',
  },
};

const benefits = [
  {
    icon: CalendarDays,
    title: 'Planning intelligent',
    description:
      'Vos repas s\'adaptent à vos préférences, vos contraintes alimentaires et votre rythme de vie.',
    color: 'var(--color-meal-breakfast)',
    bg: '#E6F7F6',
  },
  {
    icon: Shield,
    title: 'Guidé par le Nutri-Score',
    description:
      'Chaque repas est noté de A à E selon le Nutri-Score v2. Mangez équilibré sans effort.',
    color: 'var(--color-nutri-a)',
    bg: '#E6F5EC',
  },
  {
    icon: ChefHat,
    title: 'Batch Cook Dimanche',
    description:
      'Préparez toute votre semaine en 45 min avec notre checklist batch cook automatique.',
    color: 'var(--color-meal-lunch)',
    bg: '#FDF0EC',
  },
];

const steps = [
  {
    number: '01',
    title: 'Configurez vos préférences',
    description:
      'Indiquez votre régime alimentaire, vos allergies, votre objectif et le nombre de personnes à nourrir.',
    color: 'var(--color-meal-breakfast)',
  },
  {
    number: '02',
    title: 'Recevez votre planning',
    description:
      '3 repas par jour, 7 jours sur 7, chacun avec son Nutri-Score. Régénérez en un tap ce qui ne vous convient pas.',
    color: 'var(--color-meal-lunch)',
  },
  {
    number: '03',
    title: 'Cuisinez et profitez',
    description:
      'Suivez la checklist batch cook du dimanche, donnez votre feedback, et regardez votre streak monter.',
    color: 'var(--color-meal-dinner)',
  },
];

const nutriGrades = [
  { grade: 'A', color: '#037F2D', bg: '#E6F5EC', label: 'Excellent' },
  { grade: 'B', color: '#7DC243', bg: '#F1F9E8', label: 'Bon' },
  { grade: 'C', color: '#FFCC01', bg: '#FFFBE6', label: 'Correct' },
  { grade: 'D', color: '#F5860F', bg: '#FEF3E6', label: 'Limité' },
  { grade: 'E', color: '#E63312', bg: '#FDE8E6', label: 'À éviter' },
];

const freeFeatures = [
  'Planning 7 jours complet',
  'Nutri-Score sur chaque repas',
  'Régénération illimitée',
  'Checklist batch cook',
  'Suivi de streak',
];

const proFeatures = [
  'Tout le plan Gratuit',
  'Filtres avancés (allergies, régimes)',
  'Export PDF & liste de courses',
  'Historique illimité',
  'Support prioritaire',
];

const faqs = [
  {
    q: 'AssemblEat est-il vraiment gratuit ?',
    a: 'Oui, le plan Gratuit est complet et sans limite de temps. Le plan Pro débloque des fonctionnalités avancées comme l\'export PDF et les filtres détaillés.',
  },
  {
    q: 'Comment fonctionne le Nutri-Score dans l\'app ?',
    a: 'AssemblEat intègre le Nutri-Score v2 nativement. Chaque composant de repas est évalué et un score global A→E est calculé automatiquement pour chaque assemblage.',
  },
  {
    q: 'Puis-je personnaliser les repas générés ?',
    a: 'Absolument. Vous pouvez régénérer un repas en un tap, indiquer vos allergies, votre régime (végétarien, sans gluten…) et vos préférences de saveur. L\'IA s\'adapte à vos goûts au fil du temps.',
  },
  {
    q: 'L\'application fonctionne-t-elle hors ligne ?',
    a: 'AssemblEat est une PWA installable sur votre téléphone. Une fois installée, elle fonctionne hors ligne pour consulter votre planning et la checklist batch cook.',
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AssemblEat',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            description: 'Planification de repas avec Nutri-Score intégré',
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="text-lg font-bold text-[var(--color-text-main)]">
              🥗 AssemblEat
            </span>
            <div className="flex items-center gap-3">
              <a
                href="/app/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                Se connecter
              </a>
              <a
                href="/app"
                className="px-4 py-1.5 rounded-full bg-[var(--color-cta)] text-white font-semibold text-sm hover:opacity-90 transition"
              >
                Commencer
              </a>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-[#FFF8F3]">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{ background: '#FEF3E6', color: 'var(--color-cta)' }}
          >
            ✨ Nutri-Score v2 natif — Premier en France
          </div>

          <div className="text-6xl mb-6">🥗</div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
            Planifiez vos repas.
            <br />
            Mangez mieux.
            <br />
            <span style={{ color: 'var(--color-cta)' }}>Sans prise de tête.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
            AssemblEat génère votre planning de repas équilibrés avec le Nutri-Score.
            Adapté à vos goûts, vos restrictions, votre rythme.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="/app"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-orange-200"
              style={{ background: 'var(--color-cta)' }}
            >
              Commencer gratuitement →
            </a>
            <a
              href="#comment-ca-marche"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-gray-200 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition"
            >
              Comment ça marche
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Gratuit · Aucune carte requise · Installable sur mobile
          </p>

          <p className="mt-3 text-sm text-gray-400">
            Déjà un compte ?{' '}
            <a href="/app/login" className="text-[var(--color-cta)] hover:underline">
              Se connecter
            </a>
          </p>

          {/* App Preview */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-400 ml-2">assembleat.app</span>
            </div>
            <div className="p-6 bg-[var(--color-surface)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold">Bonjour Marie !</p>
                  <p className="text-sm text-gray-400">Dimanche 15 Mars</p>
                </div>
                <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">🔥 12 jours</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Breakfast card */}
                <div className="rounded-lg border-l-4 border-l-[#048A81] bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded bg-[#7DC243] text-white text-xs flex items-center justify-center font-bold">B</span>
                    <span className="text-sm font-semibold">Petit-déjeuner</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] bg-[#048A81] text-white px-1.5 py-0.5 rounded">Flocons</span>
                    <span className="text-[10px] bg-[#048A81] text-white px-1.5 py-0.5 rounded">Yaourt</span>
                    <span className="text-[10px] bg-[#048A81] text-white px-1.5 py-0.5 rounded">Banane</span>
                  </div>
                </div>
                {/* Lunch card */}
                <div className="rounded-lg border-l-4 border-l-[#E07A5F] bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded bg-[#037F2D] text-white text-xs flex items-center justify-center font-bold">A</span>
                    <span className="text-sm font-semibold">Déjeuner</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] bg-[#E07A5F] text-white px-1.5 py-0.5 rounded">Poulet</span>
                    <span className="text-[10px] bg-[#E07A5F] text-white px-1.5 py-0.5 rounded">Quinoa</span>
                    <span className="text-[10px] bg-[#E07A5F] text-white px-1.5 py-0.5 rounded">Brocolis</span>
                  </div>
                </div>
                {/* Dinner card */}
                <div className="rounded-lg border-l-4 border-l-[#3D405B] bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded bg-[#037F2D] text-white text-xs flex items-center justify-center font-bold">A</span>
                    <span className="text-sm font-semibold">Dîner</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] bg-[#3D405B] text-white px-1.5 py-0.5 rounded">Saumon</span>
                    <span className="text-[10px] bg-[#3D405B] text-white px-1.5 py-0.5 rounded">Épinards</span>
                  </div>
                  <span className="text-[9px] text-green-600 mt-1 block">Dîner léger ✓</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-16 px-4" style={{ background: '#F8F9FA' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)]">
              Fini le &quot;on mange quoi ce soir ?&quot;
            </h2>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">
              Chaque semaine, c&apos;est la même chose : trouver des idées, vérifier que c&apos;est équilibré,
              faire la liste... AssemblEat s&apos;occupe de tout en quelques secondes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium">
              {['⏱ 30 secondes pour un planning complet', '📊 Nutri-Score automatique', '🛒 Liste de courses incluse'].map(
                (item) => (
                  <span
                    key={item}
                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)]">
                Tout ce qu&apos;il vous faut
              </h2>
              <p className="mt-3 text-gray-500 text-lg">
                Une seule app pour planifier, cuisiner et suivre vos progrès.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map(({ icon: Icon, title, description, color, bg }) => (
                <div
                  key={title}
                  className="p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
                  style={{ background: bg }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'white' }}
                  >
                    <Icon size={24} style={{ color }} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="comment-ca-marche" className="py-20 px-4" style={{ background: '#F8F9FA' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)]">
                En 3 étapes simples
              </h2>
              <p className="mt-3 text-gray-500 text-lg">
                Opérationnel en moins de 2 minutes.
              </p>
            </div>
            <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              {steps.map(({ number, title, description, color }) => (
                <div key={number} className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div
                    className="text-4xl font-black mb-3 leading-none"
                    style={{ color }}
                  >
                    {number}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <a
                href="/app"
                className="inline-block px-8 py-3.5 rounded-full font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-orange-200"
                style={{ background: 'var(--color-cta)' }}
              >
                Essayer maintenant →
              </a>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-8 md:gap-16 mb-12">
              <div>
                <p className="text-3xl font-bold text-[var(--color-cta)]">500+</p>
                <p className="text-sm text-gray-500">repas générés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-meal-breakfast)]">4.8/5</p>
                <p className="text-sm text-gray-500">satisfaction</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-meal-lunch)]">30s</p>
                <p className="text-sm text-gray-500">pour planifier</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border text-left">
                <div className="flex gap-1 mb-3 text-yellow-400">★★★★★</div>
                <p className="text-gray-600 text-sm italic">&quot;Je ne me pose plus la question de quoi manger. L&apos;app décide pour moi et c&apos;est toujours équilibré.&quot;</p>
                <p className="mt-3 text-sm font-semibold">Marie, 28 ans</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border text-left">
                <div className="flex gap-1 mb-3 text-yellow-400">★★★★★</div>
                <p className="text-gray-600 text-sm italic">&quot;Le batch cook du dimanche m&apos;a fait gagner 2h par semaine. Et le Nutri-Score me rassure.&quot;</p>
                <p className="mt-3 text-sm font-semibold">Thomas, 34 ans</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border text-left">
                <div className="flex gap-1 mb-3 text-yellow-400">★★★★★</div>
                <p className="text-gray-600 text-sm italic">&quot;Mon diététicien est impressionné par mon suivi. Et c&apos;est juste une app gratuite !&quot;</p>
                <p className="mt-3 text-sm font-semibold">Sarah, 31 ans</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nutri-Score Section */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                  style={{ background: '#E6F5EC', color: '#037F2D' }}
                >
                  🏆 NUTRI-SCORE V2 NATIF
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)] mb-4">
                  La première app avec le Nutri-Score v2 intégré
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  Chaque repas généré est automatiquement noté de A à E selon le nouveau barème
                  Nutri-Score v2. Vos assemblages sont optimisés pour viser le A.
                </p>
                <ul className="mt-6 space-y-2">
                  {[
                    'Score calculé par ingrédient',
                    'Objectif A/B par défaut',
                    'Alertes si score faible',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={16} style={{ color: '#037F2D' }} strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                {nutriGrades.map(({ grade, color, bg, label }) => (
                  <div
                    key={grade}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100"
                    style={{ background: bg }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white flex-shrink-0"
                      style={{ background: color }}
                    >
                      {grade}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color }}>
                        {label}
                      </div>
                      <div className="text-xs text-gray-500">Nutri-Score {grade}</div>
                    </div>
                    <div className="ml-auto">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: color,
                          width: grade === 'A' ? '100%' : grade === 'B' ? '80%' : grade === 'C' ? '60%' : grade === 'D' ? '40%' : '20%',
                          minWidth: '40px',
                          maxWidth: '120px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4" style={{ background: '#F8F9FA' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)]">
                Transparent. Simple.
              </h2>
              <p className="mt-3 text-gray-500 text-lg">
                Commencez gratuitement, passez Pro quand vous en avez besoin.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free plan */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Gratuit
                </div>
                <div className="text-4xl font-black text-[var(--color-text-main)] mb-1">
                  0€
                </div>
                <div className="text-gray-400 text-sm mb-6">Pour toujours</div>
                <ul className="space-y-3 mb-8">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/app"
                  className="block w-full text-center py-3 rounded-xl border-2 font-semibold transition hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-cta)', color: 'var(--color-cta)' }}
                >
                  Commencer gratuitement
                </a>
              </div>

              {/* Pro plan */}
              <div
                className="p-8 rounded-2xl shadow-xl relative overflow-hidden"
                style={{ background: 'var(--color-text-main)' }}
              >
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'var(--color-cta)', color: 'white' }}
                >
                  7 jours d&apos;essai gratuit
                </div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Pro
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  3,99€
                </div>
                <div className="text-gray-400 text-sm mb-6">par mois</div>
                <ul className="space-y-3 mb-8">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 size={16} style={{ color: 'var(--color-cta)' }} className="flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`${process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? '/app'}?checkout[success_url]=${encodeURIComponent('https://assembleat.app/app?upgraded=true')}`}
                  className="block w-full text-center py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                  style={{ background: 'var(--color-cta)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Essayer Pro gratuitement →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)]">
                Questions fréquentes
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group border border-gray-200 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 transition">
                    <span className="font-semibold text-[var(--color-text-main)]">{q}</span>
                    <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform duration-200 text-xl font-light flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="py-24 px-4 text-center"
          style={{ background: 'var(--color-text-main)' }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-6">🥗</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à mieux manger ?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Rejoignez des milliers d&apos;utilisateurs qui planifient leurs repas avec AssemblEat.
              Gratuit. Instantané. Sans friction.
            </p>
            <a
              href="/app"
              className="inline-block px-10 py-4 rounded-full font-bold text-xl text-white hover:opacity-90 transition shadow-2xl"
              style={{ background: 'var(--color-cta)' }}
            >
              Commencer gratuitement →
            </a>
            <p className="mt-4 text-gray-500 text-sm">
              Aucune carte bancaire requise
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            AssemblEat © 2026 ·{' '}
            <a href="#" className="hover:text-gray-600 transition">
              Mentions légales
            </a>{' '}
            ·{' '}
            <a href="#" className="hover:text-gray-600 transition">
              Confidentialité
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
