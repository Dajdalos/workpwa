import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitch from '@/components/LanguageSwitch'
import Trans from '@/components/Trans'
import AuthCard from '@/components/AuthCard'
import { Clock, ShieldCheck, Smartphone, MessageCircle, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Work Hours & Invoices — Track. Prove. Share.',
  description:
    'Futuristic, mobile-first time tracking with photo proof, multi-PDF invoices, analytics, workspaces, and realtime chat.',
}

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Background: grid + aurora glows */}
      <div className="pointer-events-none absolute inset-0 bg-grid-slate/5 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 -left-20 aurora h-[60vh] w-[60vw]" />
      <div className="pointer-events-none absolute -bottom-40 -right-10 aurora h-[60vh] w-[60vw]" />

      {/* Top Nav (glass) */}
      <nav className="sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-grid place-items-center rounded-xl bg-white/10 p-2">
                <Clock className="h-5 w-5 text-white/90" />
              </span>
              <span className="font-semibold tracking-tight">
                <Trans k="app_name" />
              </span>
              <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                PWA
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-8 pt-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            <Trans k="hero_badge" />
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            <Trans k="hero_title" />
          </h1>

          <p className="max-w-xl text-pretty text-slate-300">
            <Trans k="hero_desc" />
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
            <Badge icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              <Trans k="features_analytics_desc" />
            </Badge>
            <Badge icon={<Smartphone className="h-3.5 w-3.5" />}>PWA</Badge>
            <Badge icon={<MessageCircle className="h-3.5 w-3.5" />}>
              <Trans k="features_analytics" />
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#auth" className="btn btn-primary">
              <Trans k="get_started" />
            </a>
            <a href="#pricing" className="btn glass text-slate-100">
              <Trans k="see_pricing" />
            </a>
          </div>
        </div>

        {/* Visual + Auth */}
        <div className="grid gap-4">
          {/* Showcase panel */}
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-fuchsia-500/10 to-emerald-500/10" />
            <Image
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop"
              alt="Team working"
              width={1600}
              height={1000}
              priority
              className="h-56 w-full object-cover opacity-90 sm:h-72"
            />
          </div>
          {/* Auth card anchor target */}
          <div id="auth" className="justify-self-end">
            <AuthCard />
          </div>
        </div>
      </section>

      {/* Feature stripe */}
      <section className="mx-auto mb-10 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            titleKey="features_photo"
            descKey="features_photo_desc"
            img="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop"
          />
          <FeatureCard
            titleKey="features_roles"
            descKey="features_roles_desc"
            img="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1600&auto=format&fit=crop"
          />
          <FeatureCard
            titleKey="features_analytics"
            descKey="features_analytics_desc"
            img="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-12 pt-2">
        <h2 className="mb-4 text-2xl font-semibold">
          <Trans k="pricing" />
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Free */}
          <PricingCard
            labelKey="pricing_free"
            price="€0"
            bullets={['features_photo', 'features_roles', 'features_analytics']}
            cta={{ labelKey: 'get_started', href: '#auth', primary: true }}
          />
          {/* Support */}
          <PricingCard
            labelKey="pricing_support"
            highlight
            price="€5"
            suffix="/mo"
            bullets={['features_photo', 'features_roles', 'features_analytics', 'pricing_thank_you']}
            cta={{ labelKey: 'pricing_support', href: '#', disabled: true }}
          />
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold">
            <Trans k="contact" />
          </h2>
          <p className="mt-1 text-slate-300">
            <Trans k="contact_desc" />
          </p>
          <a
            href="mailto:support@example.com"
            className="mt-3 inline-flex rounded-xl border border-white/15 px-3 py-2 text-slate-100 hover:bg-white/5"
          >
            support@example.com
          </a>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-slate-400">
        © {new Date().getFullYear()} <Trans k="app_name" /> — Built with care.
      </footer>
    </main>
  )
}

/* ---------- tiny server components below (they render <Trans/> inside) ---------- */

function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15">
      {icon}
      {children}
    </span>
  )
}

function FeatureCard({
  titleKey,
  descKey,
  img,
}: {
  titleKey: string
  descKey: string
  img: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Image
        src={img}
        alt=""
        width={1200}
        height={800}
        className="h-40 w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02]"
      />
      <div className="p-4">
        <div className="text-base font-semibold">
          <Trans k={titleKey} />
        </div>
        <p className="mt-1 text-sm text-slate-300">
          <Trans k={descKey} />
        </p>
      </div>
    </div>
  )
}

function PricingCard({
  labelKey,
  price,
  suffix,
  bullets,
  cta,
  highlight,
}: {
  labelKey: string
  price: string
  suffix?: string
  bullets: string[]
  cta: { labelKey: string; href: string; disabled?: boolean; primary?: boolean }
  highlight?: boolean
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-[1px]',
        highlight ? 'bg-gradient-to-r from-fuchsia-500/40 via-sky-500/40 to-emerald-500/40' : 'bg-white/10',
      ].join(' ')}
    >
      <div className="rounded-2xl bg-slate-950 p-5 ring-1 ring-white/10">
        <div className="text-lg font-semibold">
          <Trans k={labelKey} />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <div className="text-3xl font-bold">{price}</div>
          {suffix && <div className="text-sm text-slate-400">{suffix}</div>}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          {bullets.map((k) => (
            <li key={k} className="leading-6">
              <Trans k={k} />
            </li>
          ))}
        </ul>
        <a
          href={cta.href}
          aria-disabled={cta.disabled}
          className={[
            'mt-4 inline-flex w-full items-center justify-center rounded-xl px-3 py-2',
            cta.disabled
              ? 'cursor-not-allowed bg-white/5 text-slate-400 ring-1 ring-white/10'
              : cta.primary
              ? 'bg-white text-slate-900 hover:bg-white/90'
              : 'bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10',
          ].join(' ')}
        >
          <Trans k={cta.labelKey} />
        </a>
      </div>
    </div>
  )
}
