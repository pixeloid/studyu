import { Metadata } from 'next'
import Link from 'next/link'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'

export const metadata: Metadata = {
  title: 'Bemutatkozás',
  description: 'Ismerje meg a StudyU Fotóstúdiót - professzionális környezet fotózáshoz Budapest szívében.',
}

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* Geometric decorations */}
        <div
          className="absolute top-20 right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-blue)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-24 h-24 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-0 h-0 opacity-20"
          style={{
            borderLeft: '40px solid transparent',
            borderRight: '40px solid transparent',
            borderBottom: '70px solid var(--bauhaus-red)',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Bemutatkozás</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-lg text-gray-600">
              A StudyU Fotóstúdió 2020 óta várja vendégeit Budapest szívében. Célunk, hogy
              professzionális környezetet biztosítsunk minden típusú fotózáshoz.
            </p>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* About studio */}
          <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-left" className="mb-8">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-4">A stúdióról</h2>
            <p className="text-gray-600 leading-relaxed">
              120 négyzetméteres, modern stúdiónk ideális helyszín portré-, divat-,
              termék- és reklámfotózáshoz egyaránt. A természetes fényt biztosító
              nagy ablakok mellett professzionális világítástechnikával is felszereltük
              a teret.
            </p>
          </BauhausCard>

          {/* Equipment */}
          <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent accentPosition="top-right" className="mb-8">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-4">Felszerelés</h2>
            <ul className="space-y-3">
              {[
                'Profoto villanók és folyamatos fények',
                'Különböző méretű és színű háttérvásznak',
                'Softboxok, beauty dish, reflektorok',
                'Sminkasztal tükörrel és világítással',
                'Öltöző és pihenősarok',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                  />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </BauhausCard>

          {/* Services */}
          <BauhausCard padding="lg" accentColor="red" hasCornerAccent accentPosition="bottom-left" className="mb-8">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-4">Szolgáltatások</h2>
            <p className="text-gray-600 mb-4">
              A stúdióbérlés mellett kiegészítő szolgáltatásokat is kínálunk,
              hogy a fotózás minden részletét egy helyen megoldhassa:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Professzionális sminkes', icon: '✨' },
                { name: 'Stylist szolgáltatás', icon: '👗' },
                { name: 'Fodrász', icon: '💇' },
                { name: 'Fotós asszisztens', icon: '📸' },
              ].map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border-[2px] border-black"
                  style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                >
                  <span className="text-xl">{service.icon}</span>
                  <span className="font-bugrino text-sm uppercase tracking-wider">{service.name}</span>
                </div>
              ))}
            </div>
          </BauhausCard>

          {/* Location */}
          <BauhausCard padding="lg" className="mb-12">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-4">Elérhetőség</h2>
            <p className="text-gray-600">
              Stúdiónk kiválóan megközelíthető tömegközlekedéssel és autóval egyaránt.
              A közelben ingyenes parkolási lehetőség is található.
            </p>
          </BauhausCard>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat value="120m²" label="Stúdió méret" color="blue" />
            <Stat value="5+" label="Év tapasztalat" color="yellow" />
            <Stat value="1000+" label="Sikeres fotózás" color="red" />
            <Stat value="100%" label="Elégedett ügyfél" color="black" />
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">
              Készen áll a fotózásra? Foglaljon időpontot online!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/foglalas">
                <BauhausButton variant="primary" size="lg">Foglalás</BauhausButton>
              </Link>
              <Link href="/kapcsolat">
                <BauhausButton variant="default" size="lg">Kapcsolat</BauhausButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, color }: { value: string; label: string; color: 'blue' | 'yellow' | 'red' | 'black' }) {
  const colors = {
    blue: 'var(--bauhaus-blue)',
    yellow: 'var(--bauhaus-yellow)',
    red: 'var(--bauhaus-red)',
    black: 'var(--bauhaus-black)',
  }

  return (
    <div className="text-center">
      <div
        className="w-20 h-20 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: colors[color] }}
      >
        <span className={`font-bugrino text-xl ${color === 'yellow' ? 'text-black' : 'text-white'}`}>
          {value}
        </span>
      </div>
      <div className="font-bugrino text-xs uppercase tracking-wider text-gray-600">{label}</div>
    </div>
  )
}
