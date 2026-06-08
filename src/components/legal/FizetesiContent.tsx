import Link from 'next/link'

/**
 * Az Online Fizetési Tájékoztató törzsszövege — közös forrás a
 * /fizetesi-tajekoztato oldalhoz és a foglalási folyamat checkbox-modáljához.
 */
export function FizetesiContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <p className="text-gray-600 mb-8">
        A jelen Online Fizetési Tájékoztató a Dugattyús Kulturális Kft. által üzemeltetett Studyú weboldalon elérhető
        online fizetési folyamatra vonatkozik.
      </p>

      <Section number="1" title="Fizetési szolgáltató">
        <p>
          A Studyú weboldalon a bankkártyás és egyéb online fizetések feldolgozását a <strong>Stripe</strong> nemzetközi
          fizetési szolgáltató végzi.
        </p>
        <p>
          A Stripe biztonságos, iparági szabványoknak megfelelő fizetési infrastruktúrát biztosít, beleértve a PCI DSS
          megfelelőséget, a tokenizált kártyakezelést és - szükség esetén - a 3D Secure ügyfélhitelesítést.
        </p>
        <div
          className="p-4 border-[3px] border-[var(--bauhaus-blue)]"
          style={{ backgroundColor: 'rgba(0, 0, 255, 0.05)' }}
        >
          <p className="text-sm font-medium">
            A szolgáltató bankkártyaadatokat nem tárol és azokhoz közvetlenül nem fér hozzá.
          </p>
        </div>
      </Section>

      <Section number="2" title="Elfogadott fizetési módok">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map((method) => (
            <div
              key={method}
              className="p-3 border-[3px] border-black text-center font-bugrino text-sm uppercase tracking-wider"
              style={{ boxShadow: '2px 2px 0 var(--bauhaus-yellow)' }}
            >
              {method}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          ...valamint egyéb, a Stripe Checkout felületen megjelenő fizetési módok.
        </p>
      </Section>

      <Section number="3" title="A fizetési folyamat menete">
        <ol className="list-decimal pl-6 space-y-2">
          <li>A megrendelő kiválasztja a kívánt időpontot.</li>
          <li>A rendszer díjbekérőt állít ki a foglalás alapján.</li>
          <li>A fizetés a Stripe biztonságos rendszerén keresztül történik.</li>
          <li>A foglalás kizárólag sikeres fizetési visszaigazolás után válik véglegessé.</li>
          <li>Sikertelen vagy megszakadt fizetés esetén az időpont nem minősül véglegesen lefoglaltnak.</li>
        </ol>
      </Section>

      <Section number="4" title="Adatbiztonság">
        <p>A fizetés során megadott bankkártya- és fizetési adatokat a Stripe saját rendszere kezeli.</p>
        <p>
          A Studyú kizárólag a tranzakció sikerességére, az összegre, a fizetés időpontjára és a fizetéshez kapcsolódó
          technikai státuszra vonatkozó információkat kapja meg.
        </p>
        <p>
          A fizetési adatkezelés részletes szabályait a Stripe saját adatkezelési és cookie szabályzata tartalmazza, amely a{' '}
          <a href="https://stripe.com/en-hu/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--bauhaus-blue)] hover:underline">stripe.com/privacy</a> oldalon érhető el.
        </p>
      </Section>

      <Section number="5" title="Visszatérítések">
        <p>A foglalás lemondása esetén a visszatérítés a Studyú ÁSZF-ben meghatározott szabályok szerint történik.</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 border-l-[4px]" style={{ borderColor: 'var(--bauhaus-blue)' }}>
            <span className="font-bugrino text-sm uppercase">48 órával előtte:</span>
            <span className="text-sm text-gray-600">100% visszatérítés</span>
          </div>
          <div className="flex items-center gap-3 p-3 border-l-[4px]" style={{ borderColor: 'var(--bauhaus-yellow)' }}>
            <span className="font-bugrino text-sm uppercase">2-7 nappal előtte:</span>
            <span className="text-sm text-gray-600">50% visszatérítés</span>
          </div>
          <div className="flex items-center gap-3 p-3 border-l-[4px]" style={{ borderColor: 'var(--bauhaus-red)' }}>
            <span className="font-bugrino text-sm uppercase">48 órán belül / no-show:</span>
            <span className="text-sm text-gray-600">nincs visszatérítés</span>
          </div>
        </div>
        <p className="mt-3">
          A jóváhagyott visszatérítés minden esetben az eredeti fizetési módra, a Stripe rendszerén keresztül történik.
          A visszatérítés átfutási ideje a lemondás visszaigazolásától számított legfeljebb 8 munkanap, azonban a jóváírás
          sebessége a kártyakibocsátó bank feldolgozási idejétől is függ.
        </p>
      </Section>

      <Section number="6" title="Sikertelen fizetés és duplikált terhelés">
        <p>
          Amennyiben a fizetési folyamat megszakad, sikertelen, vagy a megrendelő duplikált terhelést észlel,
          kérjük, vegye fel velünk a kapcsolatot:
        </p>
        <div
          className="p-4 border-[3px] border-black"
          style={{ boxShadow: '3px 3px 0 var(--bauhaus-yellow)' }}
        >
          <p className="text-sm"><strong>E-mail:</strong> studyubp@gmail.com</p>
          <p className="text-sm"><strong>Telefon:</strong> +36 20 297 7377</p>
        </div>
        <p className="mt-3">
          A tranzakció kivizsgálását követően a szolgáltató haladéktalanul intézkedik az esetleges hibás terhelések rendezéséről.
        </p>
      </Section>

      <Section number="7" title="Záró rendelkezések">
        <p>A jelen tájékoztató a weboldalon történő közzététellel lép hatályba.</p>
        <p>
          A szolgáltató fenntartja a jogot a fizetési folyamat technikai módosítására és a tájékoztató ennek megfelelő frissítésére.
          A kapcsolódó szabályokat az{' '}
          <Link href="/aszf" className="text-[var(--bauhaus-blue)] hover:underline">ÁSZF</Link> tartalmazza.
        </p>
      </Section>
    </div>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4 flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-8 h-8 border-[3px] border-black text-sm font-bold flex-shrink-0"
          style={{ boxShadow: '2px 2px 0 var(--bauhaus-yellow)' }}
        >
          {number}
        </span>
        {title}
      </h2>
      <div className="text-gray-600 space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  )
}
