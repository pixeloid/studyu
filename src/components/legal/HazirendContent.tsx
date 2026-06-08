/**
 * A Stúdió Házirend törzsszövege — közös forrás a /hazirend oldalhoz és a
 * foglalási folyamat checkbox-modáljához.
 */
const rules = [
  {
    number: '1',
    title: 'Érkezés és távozás',
    color: 'var(--bauhaus-blue)',
    items: [
      'Kérjük, pontosan érkezzetek és a lefoglalt időablakot tartsátok be.',
      'A késés a foglalási időt nem hosszabbítja meg automatikusan.',
      'A foglalási idő végén a stúdiót rendezett állapotban kell átadni.',
    ],
  },
  {
    number: '2',
    title: 'Létszám',
    color: 'var(--bauhaus-yellow)',
    items: [
      'A stúdióban egyszerre maximum 8-10 fő tartózkodhat, a produkció jellegétől függően.',
      'Nagyobb stáb esetén előzetes egyeztetés szükséges.',
    ],
  },
  {
    number: '3',
    title: 'Berendezések és bútorok',
    color: 'var(--bauhaus-red)',
    items: [
      'A bútorok és kellékek szabadon használhatók.',
      'Átrendezés után mindent kérünk az eredeti helyére visszatenni.',
      'A berendezésekben okozott károkért a foglaló fél anyagi felelősséggel tartozik.',
    ],
  },
  {
    number: '4',
    title: 'Háttérpapír használat',
    color: 'var(--bauhaus-blue)',
    items: [
      'A háttérpapír normál használata megengedett.',
      'Sérülés, szennyezés vagy levágás esetén méter alapú pótdíjat számolunk fel.',
    ],
  },
  {
    number: '5',
    title: 'Különleges effektek és kellékek',
    color: 'var(--bauhaus-yellow)',
    items: [
      'Füstgép és gyertya használható, de ezt a foglalás előtt jelezni kell.',
      'Kisállat csak akkor hozható, ha a produkció része.',
      'Minden extra díszletet és speciális technikát előre egyeztetni szükséges.',
    ],
  },
  {
    number: '6',
    title: 'Tisztaság és extra takarítás',
    color: 'var(--bauhaus-red)',
    items: [
      'Kérjük, ügyeljetek a stúdió tisztaságára.',
      'Erős szennyeződéssel járó produkciók (pl. konfetti, por, folyadék, festék, sár) esetén extra takarítási díjat számolhatunk fel.',
    ],
  },
  {
    number: '7',
    title: 'Zaj, dohányzás, szomszédok',
    color: 'var(--bauhaus-blue)',
    items: [
      'Kérjük, a ház többi lakójára és a szomszédokra tekintettel legyetek.',
      'A folyosón és közös terekben kerüljétek a hangoskodást.',
      'A stúdióban a dohányzás kizárólag előzetes engedéllyel, forgatási kellékként megengedett.',
    ],
  },
  {
    number: '8',
    title: 'Túlhasználat / overtime',
    color: 'var(--bauhaus-yellow)',
    items: [
      'A lefoglalt idő túllépése esetén overtime díjat számolunk fel.',
      'Az overtime elszámolása megkezdett 15 percenként történik.',
    ],
  },
]

export function HazirendContent() {
  return (
    <div className="space-y-6">
      {rules.map((rule) => (
        <div
          key={rule.number}
          className="border-[3px] border-black p-6"
          style={{ boxShadow: `3px 3px 0 ${rule.color}` }}
        >
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4 flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-8 h-8 text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: rule.color }}
            >
              {rule.number}
            </span>
            {rule.title}
          </h2>
          <ul className="space-y-2">
            {rule.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                <span className="mt-1.5 w-2 h-2 flex-shrink-0" style={{ backgroundColor: rule.color }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div
        className="p-6 border-[3px] border-black text-center"
        style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)' }}
      >
        <p className="font-bugrino text-sm uppercase tracking-wider">
          A foglalás véglegesítésével kijelented, hogy a fenti házirendet megismerted és elfogadod.
        </p>
      </div>
    </div>
  )
}
