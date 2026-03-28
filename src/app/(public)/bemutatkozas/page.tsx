import { Metadata } from 'next'
import Link from 'next/link'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'

export const metadata: Metadata = {
  title: 'Bemutatkozás',
  description: 'Ismerd meg a StudyU Fotóstúdiót - professzionális környezet fotózáshoz Budapest szívében.',
}

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden py-12 sm:py-24 lg:py-32">
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
              A Studyú a Dugattyús fotóstúdiója, ami 2025 óta várja vendégeit Budapest szívében. Célunk, hogy
              professzionális környezetet biztosítsunk minden típusú fotózáshoz, hiszen a kreatív alkotás közös célunk és örömünk.
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
              Modern stúdiónk ideális helyszín portré-, divat-,
              termék- és reklámfotózáshoz, valamint content gyártáshoz. A természetes fényt biztosító
              nagy ablakok mellett professzionális világítástechnikával,
              különböző színes papírhátterekkel várunk.
            </p>
          </BauhausCard>

          {/* Equipment */}
          <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent accentPosition="top-right" className="mb-8">
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-4">Felszerelés</h2>
            <ul className="space-y-3">
              {[
                'Profoto vakufejek és folyamatos fények',
                'Különböző méretű és színű papírhátterek',
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
              A stúdióbérlés mellett opcionálisan választható szolgáltatásaink,
              hogy a fotózás minden részletét egy helyen oldd meg:
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
              A Mecset utcai bejáratunknál kültéri parkoló üzemel.
            </p>
          </BauhausCard>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap justify-center gap-4">
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
  )
}

