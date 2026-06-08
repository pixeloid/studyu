/**
 * Az Adatkezelési és Cookie Tájékoztató törzsszövege — közös forrás a
 * /adatvedelem oldalhoz és a foglalási folyamat checkbox-modáljához.
 */
export function AdatvedelemContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <p className="text-gray-600 mb-8">
        A jelen tájékoztató a Dugattyús Kulturális Kft. által üzemeltetett Studyú weboldal és online foglalási rendszer
        adatkezelési és cookie használati szabályait tartalmazza.
      </p>

      <Section number="1" title="Adatkezelő adatai">
        <ul className="list-none space-y-1">
          <li><strong>Cégnév:</strong> Dugattyús Kulturális Kft.</li>
          <li><strong>Stúdió neve:</strong> Studyú</li>
          <li><strong>Székhely:</strong> 1024 Budapest, Margit krt. 15-17.</li>
          <li><strong>Adószám:</strong> 32759851-2-41</li>
          <li><strong>E-mail:</strong> studyubp@gmail.com</li>
          <li><strong>Telefon:</strong> +36 20 297 7377</li>
        </ul>
      </Section>

      <Section number="2" title="A kezelt adatok köre">
        <p>A foglalási és kapcsolatfelvételi folyamat során az alábbi személyes adatokat kezeljük:</p>
        <ul>
          <li>név, e-mail cím, telefonszám</li>
          <li>számlázási név, számlázási cím, céges adószám</li>
          <li>foglalási időpont és szolgáltatási adatok</li>
          <li>megjegyzés mezőben megadott információk</li>
          <li>IP-cím, technikai naplóadatok</li>
        </ul>
      </Section>

      <Section number="3" title="Az adatkezelés célja és jogalapja">
        <div className="space-y-4">
          <DataPurpose
            title="Foglalás és szolgáltatás teljesítése"
            purpose="időpontfoglalás kezelése, kapcsolattartás, stúdióhasználat biztosítása"
            legal="szerződés teljesítése"
          />
          <DataPurpose
            title="Számlázás"
            purpose="díjbekérő, elektronikus számla kiállítása"
            legal="jogi kötelezettség teljesítése"
          />
          <DataPurpose
            title="Fizetés feldolgozása"
            purpose="online fizetés lebonyolítása és csalásmegelőzés"
            legal="szerződés teljesítése, valamint jogos érdek"
          />
          <DataPurpose
            title="Kapcsolatfelvétel"
            purpose="ajánlatkérés, kérdések megválaszolása"
            legal="hozzájárulás, illetve jogos érdek"
          />
          <DataPurpose
            title="Statisztika és marketing cookie-k"
            purpose="weboldal teljesítményének mérése, felhasználói élmény javítása, remarketing"
            legal="hozzájárulás"
          />
        </div>
      </Section>

      <Section number="4" title="Adatfeldolgozók">
        <p>A szolgáltatás működtetéséhez az alábbi adatfeldolgozókat vesszük igénybe:</p>
        <ul>
          <li><strong>Saját foglalási rendszer</strong> - időpontkezelés és kapcsolódó ügyféladatok</li>
          <li><strong>Számlázz.hu</strong> - díjbekérők és elektronikus számlák kiállítása</li>
          <li><strong>Stripe</strong> - online fizetés lebonyolítása</li>
          <li><strong>Tárhelyszolgáltató / webszerver</strong> - technikai üzemeltetés</li>
          <li><strong>Google Analytics / Meta Pixel</strong> - amennyiben aktiválva vannak</li>
        </ul>
      </Section>

      <Section number="5" title="Adatmegőrzési idők">
        <div className="border-[3px] border-black overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left p-3 font-bugrino uppercase tracking-wider text-xs">Adattípus</th>
                <th className="text-left p-3 font-bugrino uppercase tracking-wider text-xs">Megőrzés</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t-[2px] border-gray-200">
                <td className="p-3">Számlázási adatok</td>
                <td className="p-3">8 év</td>
              </tr>
              <tr className="border-t-[2px] border-gray-200 bg-gray-50">
                <td className="p-3">Foglalási adatok</td>
                <td className="p-3">2 év</td>
              </tr>
              <tr className="border-t-[2px] border-gray-200">
                <td className="p-3">Kapcsolatfelvételi üzenetek</td>
                <td className="p-3">12 hónap</td>
              </tr>
              <tr className="border-t-[2px] border-gray-200 bg-gray-50">
                <td className="p-3">Szerverlogok</td>
                <td className="p-3">30-90 nap</td>
              </tr>
              <tr className="border-t-[2px] border-gray-200">
                <td className="p-3">Marketing cookie-k</td>
                <td className="p-3">max. 12 hónap</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section number="6" title="Érintetti jogok">
        <p>Az érintettet megilleti:</p>
        <ul>
          <li>hozzáféréshez való jog</li>
          <li>helyesbítéshez való jog</li>
          <li>törléshez való jog</li>
          <li>adatkezelés korlátozásához való jog</li>
          <li>tiltakozáshoz való jog</li>
          <li>adathordozhatósághoz való jog</li>
          <li>hozzájárulás visszavonásának joga</li>
        </ul>
        <p>
          Az érintett panasszal élhet a <strong>Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH)</strong>{' '}
          (1055 Budapest, Falk Miksa utca 9-11., ugyfelszolgalat@naih.hu).
        </p>
      </Section>

      {/* Cookie section with different accent */}
      <div id="cookie-tajekoztato" className="my-12 py-8 border-t-[3px] border-b-[3px] border-black scroll-mt-24">
        <h2 className="font-bugrino text-2xl uppercase tracking-wider mb-8 text-center">Cookie Tájékoztató</h2>

        <Section number="7" title="Mi az a cookie?">
          <p>
            A cookie (süti) egy kis adatfájl, amelyet a weboldal a látogató böngészőjében helyez el a megfelelő működés,
            teljesítménymérés és marketing célok érdekében.
          </p>
        </Section>

        <Section number="8" title="Az általunk használt cookie-k">
          <div className="space-y-4">
            <CookieType
              name="Elengedhetetlen cookie-k"
              description="A weboldal működéséhez, bejelentkezéshez, foglalási folyamat fenntartásához szükséges sütik."
              color="var(--bauhaus-blue)"
            />
            <CookieType
              name="Preferencia cookie-k"
              description="Nyelvi, felhasználói vagy megjelenítési beállításokat tároló sütik."
              color="var(--bauhaus-yellow)"
            />
            <CookieType
              name="Statisztikai cookie-k"
              description="A látogatói viselkedés mérésére szolgálnak (pl. Google Analytics)."
              color="var(--bauhaus-red)"
            />
            <CookieType
              name="Marketing cookie-k"
              description="Remarketing és hirdetési célú sütik (pl. Meta Pixel, Google Ads)."
              color="var(--bauhaus-red)"
            />
            <CookieType
              name="Fizetési és biztonsági cookie-k"
              description="A Stripe fizetési folyamat biztonságos lebonyolításához szükséges sütik."
              color="var(--bauhaus-blue)"
            />
          </div>
        </Section>

        <Section number="9" title="Cookie hozzájárulás">
          <p>A nem szükséges cookie-k kizárólag előzetes hozzájárulás alapján aktiválódnak.</p>
          <p>A látogató a cookie bannerben bármikor:</p>
          <ul>
            <li>elfogadhatja az összes sütit</li>
            <li>elutasíthatja a nem szükséges sütiket</li>
            <li>testreszabhatja preferenciáit</li>
          </ul>
        </Section>
      </div>

      <Section number="10" title="Záró rendelkezések">
        <p>
          A jelen tájékoztató a weboldalon történő közzététellel lép hatályba. A szolgáltató fenntartja a jogot a dokumentum
          frissítésére a jogszabályi változásoknak és a weboldal technikai fejlesztéseinek megfelelően.
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
          style={{ boxShadow: '2px 2px 0 var(--bauhaus-red)' }}
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

function DataPurpose({ title, purpose, legal }: { title: string; purpose: string; legal: string }) {
  return (
    <div className="p-4 border-[2px] border-gray-200">
      <p className="font-bugrino text-sm uppercase tracking-wider mb-1">{title}</p>
      <p className="text-sm"><strong>Cél:</strong> {purpose}</p>
      <p className="text-sm"><strong>Jogalap:</strong> {legal}</p>
    </div>
  )
}

function CookieType({ name, description, color }: { name: string; description: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 border-l-[4px]" style={{ borderColor: color }}>
      <div>
        <p className="font-bugrino text-sm uppercase tracking-wider">{name}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
