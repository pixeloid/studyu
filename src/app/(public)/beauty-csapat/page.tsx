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
            Fotózásod mellé szakértő sminkest és hair stylistot is foglalhatsz. A beauty csapatot egyben
            4, 6 vagy 12 órára, a szakembereket pedig külön-külön, órára is kiválaszthatod – a stúdióbérléssel együtt,
            ugyanabban a foglalásban.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-8 pb-16 space-y-12">
        {(packages || []).map((pkg) => {
          const tiers = [...pkg.staff_package_tiers].sort((a, b) => a.hours - b.hours)
          return (
            <section
              key={pkg.id}
              className="border-[3px] border-black p-6 sm:p-8"
              style={{ backgroundColor: 'var(--bauhaus-yellow)', boxShadow: '8px 8px 0 var(--bauhaus-black)' }}
            >
              <h2 className="text-bauhaus-heading mb-2">{pkg.name}</h2>
              {pkg.description && <p className="text-gray-800 mb-4">{pkg.description}</p>}
              <div className="flex flex-wrap gap-2">
                {[...pkg.allowed_hours].sort((a, b) => a - b).map((h) => (
                  <BauhausBadge key={h} variant="black">{h} óra</BauhausBadge>
                ))}
              </div>
              <ul className="mt-4 text-sm space-y-1">
                <li>Óradíj (csapat): <strong>{ft(pkg.hourly_rate)}</strong></li>
                {tiers.map((t) => (
                  <li key={t.id}>
                    {t.label} ({t.hours} óra): <strong>{ft(t.price)}</strong>{t.note ? ` · ${t.note}` : ''}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-700 mt-3">
                A rendszer foglalásnál automatikusan a kedvezőbb (óra- vagy fix) díjat számolja. Az árak bruttó árak.
              </p>
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
                    Külön foglalásnál az óraszámot és a kezdést a szakembernél adod meg. Az árak bruttó árak.
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
