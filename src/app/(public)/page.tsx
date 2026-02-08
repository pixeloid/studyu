import Link from 'next/link'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausHero } from '@/components/ui/bauhaus/BauhausHero'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <BauhausHero
        title="Professzionális Fotóstúdió"
        subtitle="Modern, teljesen felszerelt stúdió Budapesten. Ideális portré-, termék- és reklámfotózáshoz."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/foglalas">
            <BauhausButton variant="accent" size="lg">
              Foglalás most
            </BauhausButton>
          </Link>
          <Link href="/galeria">
            <BauhausButton variant="default" size="lg">
              Galéria megtekintése
            </BauhausButton>
          </Link>
        </div>
      </BauhausHero>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Geometric background decoration */}
        <div
          className="absolute top-20 -right-20 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: 'var(--bauhaus-blue)' }}
        />
        <div
          className="absolute bottom-20 -left-10 w-32 h-32 opacity-10"
          style={{
            backgroundColor: 'var(--bauhaus-red)',
            transform: 'rotate(45deg)',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-bauhaus-heading text-black mb-4">
              Miért válasszon minket?
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-[3px] bg-black" />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              />
              <div className="w-12 h-[3px] bg-black" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<CameraIcon />}
              title="Modern felszerelés"
              description="Professzionális világítástechnika, háttérvásznak és minden szükséges kellék."
              accentColor="blue"
            />
            <FeatureCard
              icon={<ClockIcon />}
              title="Rugalmas időbeosztás"
              description="Délelőtti, délutáni vagy egész napos foglalás - válassza az Önnek megfelelőt."
              accentColor="yellow"
            />
            <FeatureCard
              icon={<SparklesIcon />}
              title="Kiegészítő szolgáltatások"
              description="Sminkes, stylist, fodrász - mindent megtalál egy helyen."
              accentColor="red"
            />
            <FeatureCard
              icon={<MapPinIcon />}
              title="Központi elhelyezkedés"
              description="Könnyen megközelíthető helyszín Budapest szívében."
              accentColor="yellow"
            />
            <FeatureCard
              icon={<CreditCardIcon />}
              title="Online foglalás"
              description="Egyszerű, gyors foglalási folyamat azonnali visszaigazolással."
              accentColor="blue"
            />
            <FeatureCard
              icon={<ShieldCheckIcon />}
              title="Átlátható árazás"
              description="Nincsenek rejtett költségek - pontosan tudja, miért fizet."
              accentColor="red"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bauhaus-black)' }}
      >
        {/* Geometric decorations */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />
        <div
          className="absolute top-1/2 right-20 -translate-y-1/2 opacity-10 hidden lg:block"
          style={{
            width: 0,
            height: 0,
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: '140px solid var(--bauhaus-blue)',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-bauhaus-heading text-white mb-6">
              Készen áll a foglalásra?
            </h2>
            <p className="text-lg text-gray-300 mb-10">
              Válassza ki a megfelelő időpontot és foglaljon online néhány kattintással.
            </p>
            <Link href="/foglalas">
              <BauhausButton variant="accent" size="lg">
                Foglalás indítása
              </BauhausButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-t-[3px] border-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem value="500+" label="Elégedett ügyfél" color="blue" />
            <StatItem value="50m²" label="Stúdió méret" color="yellow" />
            <StatItem value="24/7" label="Online foglalás" color="red" />
            <StatItem value="5+" label="Év tapasztalat" color="blue" />
          </div>
        </div>
      </section>
    </>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accentColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: 'red' | 'yellow' | 'blue'
}) {
  const iconBgColors = {
    red: 'var(--bauhaus-red)',
    yellow: 'var(--bauhaus-yellow)',
    blue: 'var(--bauhaus-blue)',
  }

  return (
    <BauhausCard
      accentColor={accentColor}
      hasCornerAccent
      accentPosition="top-right"
      padding="lg"
    >
      <div
        className="w-14 h-14 rounded-full border-[3px] border-black flex items-center justify-center mb-4"
        style={{ backgroundColor: iconBgColors[accentColor] }}
      >
        <div className={accentColor === 'yellow' ? 'text-black' : 'text-white'}>
          {icon}
        </div>
      </div>
      <h3 className="font-bugrino text-lg uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </BauhausCard>
  )
}

function StatItem({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: 'red' | 'yellow' | 'blue'
}) {
  const colors = {
    red: 'var(--bauhaus-red)',
    yellow: 'var(--bauhaus-yellow)',
    blue: 'var(--bauhaus-blue)',
  }

  return (
    <div className="text-center">
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full border-[3px] border-black mb-4"
        style={{ backgroundColor: colors[color] }}
      >
        <span
          className={`font-bugrino text-xl ${color === 'yellow' ? 'text-black' : 'text-white'}`}
        >
          {value}
        </span>
      </div>
      <p className="font-bugrino text-sm uppercase tracking-wider">{label}</p>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}
