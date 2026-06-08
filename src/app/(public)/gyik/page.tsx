'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqCategories = [
  {
    title: 'Általános információk',
    questions: [
      {
        q: 'Mire bérelhető a stúdió?',
        a: 'A Studyú fotózásokhoz, videóforgatásokhoz, interjúkhoz, reklámanyagokhoz, social content gyártáshoz és kisebb kreatív produkciókhoz bérelhető.',
      },
      {
        q: 'Hol található a stúdió?',
        a: 'A stúdió címe: 1024 Budapest, Margit krt. 15-17.',
      },
      {
        q: 'Hány fő tartózkodhat bent egyszerre?',
        a: 'A stúdióban egyszerre általában maximum 8-10 fő tartózkodhat, a produkció jellegétől függően. Nagyobb stábbal érkezés esetén előzetes egyeztetés szükséges.',
      },
    ],
  },
  {
    title: 'Foglalás és fizetés',
    questions: [
      {
        q: 'Hogyan tudok időpontot foglalni?',
        a: 'A foglalás a weboldalon keresztül történik az elérhető időpontok kiválasztásával.',
      },
      {
        q: 'Mikor válik véglegessé a foglalás?',
        a: 'A foglalás a díjbekérő kiegyenlítésével válik véglegessé.',
      },
      {
        q: 'Mennyi időn belül kell fizetni?',
        a: 'A kiállított díjbekérőt 24 órán belül kell kiegyenlíteni. Ennek hiányában a foglalás törölhető.',
      },
      {
        q: 'Kapok számlát?',
        a: 'Igen. A befizetést követően a rendszer elektronikus számlát állít ki a Számlázz.hu rendszerén keresztül.',
      },
    ],
  },
  {
    title: 'Lemondás és módosítás',
    questions: [
      {
        q: 'Lemondható a foglalás?',
        a: 'Igen. A foglalás a kezdési időpont előtt legalább 48 órával díjmentesen lemondható.',
      },
      {
        q: 'Mi történik, ha időben lemondom?',
        a: 'Ebben az esetben a befizetett összeg 100%-ban visszatérítésre kerül.',
      },
      {
        q: 'Mi történik 48 órán belüli lemondásnál?',
        a: '48 órán belüli lemondás esetén nincs visszatérítés.',
      },
      {
        q: 'Mi történik, ha nem jelenek meg?',
        a: 'Meg nem jelenés esetén (no-show) nincs visszatérítés.',
      },
    ],
  },
  {
    title: 'Használat és szabályok',
    questions: [
      {
        q: 'Késhetek?',
        a: 'Késés esetén a foglalási idő nem hosszabbodik meg automatikusan, ezért érdemes pontosan érkezni.',
      },
      {
        q: 'Mi történik, ha tovább maradunk?',
        a: 'A lefoglalt idő túllépése esetén overtime díjat számolunk fel, megkezdett 15 percenként.',
      },
      {
        q: 'Átrendezhetők a bútorok?',
        a: 'Igen, de kérjük, hogy a foglalás végén mindent az eredeti helyére tegyetek vissza.',
      },
      {
        q: 'Használható a háttérpapír?',
        a: 'Igen. Sérülés, szennyezés vagy levágás esetén méter alapú pótdíjat számolunk fel.',
      },
      {
        q: 'Lehet kisállatot hozni?',
        a: 'Igen, amennyiben a fotózás vagy forgatás díszletéhez, koncepciójához szükséges.',
      },
      {
        q: 'Lehet füstgépet vagy gyertyát használni?',
        a: 'Igen, de ezt előre jelezni kell a foglalás előtt.',
      },
      {
        q: 'Lehet hangos zene?',
        a: 'Kérjük, hogy a ház többi lakójára és a szomszédokra tekintettel legyetek. A stúdión belül lehet zene, de kérjük, kerüljétek a zavaró hangerőt, különösen az érkezés és távozás során a közös terekben.',
      },
      {
        q: 'Lehet dohányozni?',
        a: 'A stúdióban dohányzás kizárólag előzetes engedéllyel, forgatási kellékként megengedett.',
      },
    ],
  },
  {
    title: 'Tisztaság és felelősség',
    questions: [
      {
        q: 'Mi történik, ha koszolással jár a produkció?',
        a: 'Erős szennyeződéssel járó munkák esetén – például konfetti, por, folyadék, festék vagy sár használatakor – extra takarítási díjat számolhatunk fel.',
      },
      {
        q: 'Ki felel a károkért?',
        a: 'A foglaló fél felel minden olyan kárért, amelyet ő vagy a vele érkező stábtagok, modellek, közreműködők okoznak a stúdióban vagy a berendezésekben.',
      },
    ],
  },
]

export default function GyikPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-12 sm:py-24 lg:py-32">
        <div
          className="absolute top-20 right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-24 h-24 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-blue)' }}
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Gyakori Kérdések</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-gray-600">
              Összegyűjtöttük a leggyakrabban felmerülő kérdéseket a stúdió használatáról.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="mx-auto max-w-3xl px-6 lg:px-8 pb-24">
        {faqCategories.map((category, catIndex) => (
          <div key={catIndex} className="mb-10">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-6 flex items-center gap-3">
              <div
                className="w-3 h-3"
                style={{
                  backgroundColor: ['var(--bauhaus-blue)', 'var(--bauhaus-yellow)', 'var(--bauhaus-red)', 'var(--bauhaus-black)', 'var(--bauhaus-blue)'][catIndex],
                }}
              />
              {category.title}
            </h2>
            <div className="space-y-3">
              {category.questions.map((item, qIndex) => (
                <FaqItem key={qIndex} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div
          className="mt-12 p-8 border-[3px] border-black text-center"
          style={{ boxShadow: '4px 4px 0 var(--bauhaus-yellow)' }}
        >
          <h3 className="font-bugrino text-lg uppercase tracking-wider mb-3">
            Nem találtad a választ?
          </h3>
          <p className="text-gray-600 mb-4">Keress minket bizalommal!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:studyubp@gmail.com"
              className="inline-block px-6 py-3 border-[3px] border-black font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              studyubp@gmail.com
            </a>
            <a
              href="tel:+36202977377"
              className="inline-block px-6 py-3 border-[3px] border-black font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              +36 20 297 7377
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t-[3px] border-gray-200">
          <p className="text-sm text-gray-500">
            Részletes szabályok:{' '}
            <Link href="/aszf" className="text-[var(--bauhaus-blue)] hover:underline">ÁSZF</Link>
            {' | '}
            <Link href="/hazirend" className="text-[var(--bauhaus-blue)] hover:underline">Házirend</Link>
            {' | '}
            <Link href="/fizetesi-tajekoztato" className="text-[var(--bauhaus-blue)] hover:underline">Fizetési Tájékoztató</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-[3px] border-black transition-shadow"
      style={open ? { boxShadow: '3px 3px 0 var(--bauhaus-blue)' } : {}}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t-[2px] border-gray-200">
          <p className="text-sm text-gray-600 pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}
