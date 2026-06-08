import Link from 'next/link'

/**
 * Az ÁSZF törzsszövege — egyetlen forrásból használja az /aszf oldal és a
 * foglalási folyamat checkbox-modálja is.
 */
export function AszfContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <p className="text-gray-600 mb-8">
        A jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) a Dugattyús Kulturális Kft. által üzemeltetett
        Studyú fotóstúdió online foglalási rendszerén keresztül igénybe vehető stúdióbérleti szolgáltatás feltételeit szabályozza.
      </p>

      <Section number="1" title="Szolgáltató adatai">
        <ul className="list-none space-y-1 text-gray-600">
          <li><strong>Cégnév:</strong> Dugattyús Kulturális Kft.</li>
          <li><strong>Stúdió neve:</strong> Studyú</li>
          <li><strong>Székhely:</strong> 1024 Budapest, Margit krt. 15-17.</li>
          <li><strong>Adószám:</strong> 32759851-2-41</li>
          <li><strong>E-mail:</strong> studyubp@gmail.com</li>
          <li><strong>Telefon:</strong> +36 20 297 7377</li>
        </ul>
      </Section>

      <Section number="2" title="A szolgáltatás tárgya">
        <p>
          A szolgáltató a Studyú fotóstúdió helyiségeit fotózások, videóforgatások, reklámanyagok, interjúk,
          tartalomgyártás és egyéb kreatív produkciók céljára időalapú bérleti konstrukcióban biztosítja.
        </p>
        <p>A weboldal célja:</p>
        <ul>
          <li>információ nyújtása a stúdióról,</li>
          <li>szabad időpontok megjelenítése,</li>
          <li>online foglalás biztosítása,</li>
          <li>automatikus díjbekérő és számlázási folyamat kezelése.</li>
        </ul>
      </Section>

      <Section number="3" title="Foglalási folyamat">
        <ul>
          <li>A megrendelő kiválasztja a kívánt időpontot a weboldalon.</li>
          <li>A foglalás elküldésével a megrendelő elfogadja a jelen ÁSZF rendelkezéseit.</li>
          <li>A rendszer a foglalást követően automatikusan díjbekérőt állít ki a Számlázz.hu rendszerén keresztül.</li>
          <li>A foglalás kizárólag a díjbekérő kiegyenlítésével válik véglegessé.</li>
          <li>A díjbekérőt a kiállítástól számított 24 órán belül kell megfizetni.</li>
          <li>Amennyiben a fizetés a fenti határidőn belül nem történik meg, a szolgáltató jogosult a foglalást automatikusan törölni.</li>
        </ul>
      </Section>

      <Section number="4" title="Szerződés létrejötte">
        <p>
          A szerződés a megrendelő és a szolgáltató között a „Lefoglalom” gombra történő kattintással és a foglalásról szóló
          visszaigazolás megadott e-mail címen történő hozzáférhetővé válásával jön létre.
        </p>
        <p>
          A szerződés üzlethelyiségen kívül kötött szerződés, kizárólag elektronikus formában kerül megkötésre, így nem minősül
          írásba foglalt szerződésnek, és utólag nem kereshető vissza. A szerződés nyelve magyar. A foglalási oldalon megadott
          adatok helyességéért a megrendelő felel.
        </p>
      </Section>

      <Section number="5" title="Díjszabás és extra szolgáltatások">
        <p>
          A szolgáltatás alapját a stúdió óradíj alapú bérleti díja képezi, amely a foglalási rendszerben a kiválasztott
          időtartam alapján automatikusan kerül kiszámításra.
        </p>
        <p>
          A megrendelő a foglalás során a megjegyzés rovatban jelezheti az egyedi extra szolgáltatási igényeit, különösen például:
        </p>
        <ul>
          <li>asszisztens</li>
          <li>sminkes</li>
          <li>öltöztető</li>
          <li>technikai személyzet</li>
          <li>speciális kellék vagy berendezés</li>
          <li>egyedi produkciós előkészítés</li>
        </ul>
        <p>
          Az ilyen jellegű extra szolgáltatások egyedi árképzés alapján, előzetes egyeztetéssel vehetők igénybe.
          A foglalás beérkezését követően a szolgáltató munkatársa felveszi a kapcsolatot a megrendelővel az igény pontosítása,
          az egyedi ajánlat egyeztetése és az esetleges felár meghatározása érdekében.
        </p>
        <p>
          Az egyedileg egyeztetett extra szolgáltatások díja a végösszeg részét képezi, amelyről a megrendelő külön visszaigazolást kap.
          A szolgáltató fenntartja a jogot arra, hogy az extra szolgáltatási igények teljesítését kapacitás,
          rendelkezésre állás vagy szakmai megfelelőség alapján elfogadja vagy visszautasítsa.
        </p>
      </Section>

      <Section number="6" title="Fizetési feltételek">
        <p>A fizetés elektronikus úton, a díjbekérőben megjelölt módon történik.</p>
        <p>A szolgáltató a befizetést követően elektronikus számlát állít ki a Számlázz.hu rendszerén keresztül.</p>
        <p>
          A megrendelő felelős azért, hogy a számlázási adatok helyesen kerüljenek megadásra. A fizetési folyamat részleteit a{' '}
          <Link href="/fizetesi-tajekoztato" className="text-[var(--bauhaus-blue)] hover:underline">Online Fizetési Tájékoztató</Link> tartalmazza.
        </p>
      </Section>

      <Section number="7" title="Lemondási és visszatérítési feltételek">
        <ul>
          <li>A foglalás a kezdési időpont előtt legalább 48 órával díjmentesen lemondható, ilyenkor a befizetett összeg 100%-a visszatérítésre kerül.</li>
          <li>A kezdés előtt 2-7 nappal történő lemondás esetén 50% lemondási díjat számítunk fel.</li>
          <li>48 órán belüli lemondás esetén a szolgáltató jogosult a teljes bérleti díjat megtartani.</li>
          <li>Meg nem jelenés (no-show) esetén nincs visszatérítés.</li>
          <li>A visszatérítés minden esetben az eredeti fizetési móddal megegyező módon történik.</li>
          <li>A visszatérítés határideje a lemondás visszaigazolásától számított 8 munkanap.</li>
        </ul>
      </Section>

      <Section number="8" title="A stúdió használatának szabályai">
        <p>A stúdióban egyidejűleg legfeljebb 8-10 fő stábtag tartózkodhat, a produkció jellegétől függően.</p>
        <p>Kisállat bevitele kizárólag abban az esetben engedélyezett, amennyiben az a fotózás vagy forgatás díszletéhez szükséges.</p>
        <p>Füstgép és gyertya használata megengedett, azonban ezt a foglalás során előzetesen jelezni szükséges.</p>
        <p>
          A háttérpapír sérülése, szennyezése vagy használatból eredő levágása esetén a szolgáltató méter alapú díjat
          jogosult felszámítani.
        </p>
        <p>
          A megrendelő köteles a stúdiót rendeltetésszerűen használni és rendezett állapotban átadni. A részletes szabályokat a{' '}
          <Link href="/hazirend" className="text-[var(--bauhaus-blue)] hover:underline">Stúdió Házirend</Link> tartalmazza.
        </p>
      </Section>

      <Section number="9" title="Felelősség károkozásért">
        <p>
          A megrendelő teljes anyagi felelősséggel tartozik minden olyan kárért, amelyet ő vagy az általa bevitt személyek,
          modellek, stábtagok a stúdióban vagy a berendezésekben okoznak.
        </p>
      </Section>

      <Section number="10" title="Késés és overtime">
        <p>A megrendelő késése esetén a lefoglalt időtartam nem hosszabbodik meg automatikusan.</p>
        <p>A lefoglalt idő túllépése esetén a szolgáltató megkezdett 15 percenként overtime díjat jogosult felszámítani.</p>
      </Section>

      <Section number="11" title="Elállás, felmondás fogyasztói szerződések esetén">
        <p>
          Fogyasztónak minősülő megrendelő esetén a fogyasztót a 45/2014. (II.26.) Korm. rendelet alapján indokolás nélküli
          elállás illeti meg a szerződés megkötésének napjától számított tizennégy napon belül, valamint a fogyasztó kifejezett
          kérésére határidő előtt megkezdett teljesítés esetén – szintén ezen határidőn belül – indokolás nélküli felmondási jog.
        </p>
        <p>
          A fogyasztó <strong>nem gyakorolhatja</strong> elállási vagy felmondási jogát a szolgáltatás maradéktalan teljesítése után,
          ha a teljesítés a fogyasztó kifejezett előzetes beleegyezésével és annak tudomásulvételével kezdődött meg, hogy a
          szolgáltatás maradéktalan teljesítését követően elveszíti elállási jogát. A lefoglalt időpont a teljesítés megkezdése,
          ezért a foglalás véglegesítésével a fogyasztó tudomásul veszi, hogy a megkezdett teljesítést követően elállási jogát elveszíti.
        </p>
      </Section>

      <Section number="12" title="Panaszkezelés">
        <p>
          A megrendelő panaszát szóban (telefonon, személyesen), e-mailben (studyubp@gmail.com) vagy postai úton
          (1024 Budapest, Margit krt. 15-17. földszint 3.) terjesztheti elő.
        </p>
        <p>
          Az írásbeli panaszt a szolgáltató a beérkezést követő 30 napon belül írásban megválaszolja, elutasító álláspontját megindokolja.
          A panaszról készült jegyzőkönyvet a szolgáltató 3 évig megőrzi.
        </p>
        <p>
          A fogyasztónak minősülő megrendelő panaszával a békéltető testülethez, illetve a fogyasztóvédelmi hatósághoz is fordulhat.
          A békéltető testületi eljárásokról itt tájékozódhat:{' '}
          <a href="https://bekeltetes.hu/udvozlo" target="_blank" rel="noopener noreferrer" className="text-[var(--bauhaus-blue)] hover:underline">bekeltetes.hu</a>.
        </p>
      </Section>

      <Section number="13" title="Adatvédelem">
        <p>
          A szolgáltató a foglaláskor megadott személyes adatokat a GDPR és a vonatkozó magyar jogszabályok szerint kezeli.
          Az adatkezelés célja a stúdióbérleti szolgáltatás nyújtása, a szerződés megkötése és teljesítése, a számlázás, a
          kapcsolattartás és a panaszkezelés. A részletes szabályokat az{' '}
          <Link href="/adatvedelem" className="text-[var(--bauhaus-blue)] hover:underline">Adatkezelési Tájékoztató</Link> tartalmazza.
        </p>
      </Section>

      <Section number="14" title="Záró rendelkezések">
        <p>
          A jelen ÁSZF-re a magyar jog rendelkezései irányadók. A foglalás véglegesítésével a megrendelő kijelenti,
          hogy a jelen ÁSZF-et megismerte és elfogadta.
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
          style={{ boxShadow: '2px 2px 0 var(--bauhaus-blue)' }}
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
