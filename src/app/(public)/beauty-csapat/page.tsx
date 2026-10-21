import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

export const metadata: Metadata = {
  title: 'Beauty csapat',
  description:
    'A StudyU beauty csapata: tapasztalt sminkes és hair stylist szakemberek a fotózásodhoz. Foglald le a stúdióbérlés mellé.',
}

export const dynamic = 'force-dynamic'

const ft = (n: number) => `${n.toLocaleString('hu-HU')} Ft`

export default async function BeautyTeamPage() {
  const supabase = await createClient()
  const { data: staff } = await supabase
    .from('staff_members')
    .select('*, staff_rate_tiers(*)')
    .eq('is_active', true)
    .order('sort_order')

  const { data: packages } = await supabase
    .from('staff_packages')
    .select('*, staff_package_tiers(*)')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="bg-white">
      <div className="relative overflow-hidden py-12 sm:py-20">
        <div
          className="absolute top-16 right-10 w-28 h-28 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />
        <div
          className="absolute bottom-6 left-10 w-20 h-20 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
          <h1 className="text-bauhaus-display mb-4">Beauty csapat</h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-[3px] bg-black" />
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
            <div className="w-12 h-[3px] bg-black" />
          </div>
          <p className="text-lg text-gray-700">
            Fotózásod mellé szakértő sminkest és hair stylistot is foglalhatsz: Bencét és Barbarát együtt vagy külön-külön,
            a stúdióbérléssel egy foglalásban.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-8 pb-16 space-y-12">
        {(packages || []).map((pkg) => {
          const tiers = [...pkg.staff_package_tiers].sort((a, b) => a.hours - b.hours)
          if (tiers.length === 0) return null
          return (
            <section
              key={pkg.id}
              className="border-[3px] border-black p-6 sm:p-8"
              style={{ backgroundColor: 'var(--bauhaus-yellow)', boxShadow: '8px 8px 0 var(--bauhaus-black)' }}
            >
              <h2 className="text-bauhaus-heading mb-2">Bence és Barbara együtt</h2>
              <p className="text-gray-800 mb-5">
                Ha hosszabb forgatásra, több modellhez vagy egész napra kell a beauty csapat, őket együtt is foglalhatod.
              </p>
              <div className="flex flex-wrap gap-4">
                {tiers.map((t) => (
                  <div key={t.id} className="bg-white border-[3px] border-black px-5 py-3" style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}>
                    <p className="font-bugrino text-sm uppercase tracking-wider">{t.label} · {t.hours} óra</p>
                    <p className="font-bugrino text-2xl">{ft(t.price)}</p>
                    {t.note && <p className="text-xs text-gray-600">{t.note}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-700 mt-4">Az árak bruttó árak.</p>
            </section>
          )
        })}

        <h2 className="text-bauhaus-heading text-center">A csapat tagjai</h2>
        {(staff || []).map((m, i) => {
          const tiers = [...m.staff_rate_tiers].sort((a, b) => a.hours - b.hours)
          return (
            <article
              key={m.id}
              className="grid grid-cols-1 md:grid-cols-5 border-[3px] border-black bg-white"
              style={{ boxShadow: '8px 8px 0 var(--bauhaus-black)' }}
            >
              {m.image_url && (
                <div className={`md:col-span-2 ${i % 2 ? 'md:order-2 md:border-l-[3px]' : 'md:border-r-[3px]'} border-black`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover aspect-[4/5] md:aspect-auto" />
                </div>
              )}
              <div className="md:col-span-3 p-6 sm:p-8 flex flex-col gap-4">
                <div>
                  <h2 className="text-bauhaus-heading">{m.name}</h2>
                  <p className="text-sm uppercase tracking-wider text-gray-600 mt-1">{m.role_name}</p>
                </div>
                {m.bio && <p className="text-gray-700 leading-relaxed">{m.bio}</p>}

                <div>
                  <h3 className="font-bugrino text-sm uppercase tracking-wider mb-2">Díjak</h3>
                  <div className="flex flex-wrap gap-2">
                    <BauhausBadge variant="outline">Külön foglalva: {ft(m.hourly_rate)} / óra</BauhausBadge>
                    {tiers.map((t) => (
                      <BauhausBadge key={t.id} variant="yellow">
                        {t.label} ({t.hours} óra) {ft(t.price)}
                        {t.note ? ` · ${t.note}` : ''}
                      </BauhausBadge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Külön foglalásnál te adod meg, hány órára kéred (1–12 óra), és mikor kezdődjön. Az árak bruttó árak.
                  </p>
                </div>
              </div>
            </article>
          )
        })}

        {(!staff || staff.length === 0) && (
          <p className="text-center text-gray-500">A beauty csapat bemutatása hamarosan érkezik.</p>
        )}

        <div className="text-center">
          <Link href="/foglalas">
            <BauhausButton variant="primary" size="lg">Foglalás beauty csapattal</BauhausButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
