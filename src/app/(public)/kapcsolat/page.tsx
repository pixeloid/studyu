import { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

export const metadata: Metadata = {
  title: 'Kapcsolat',
  description: 'Lépjen kapcsolatba a StudyU Fotóstúdióval - elérhetőségeink és üzenetküldési lehetőség.',
}

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* Geometric decorations */}
        <div
          className="absolute top-20 right-20 w-28 h-28 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-20 h-20 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-blue)' }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Kapcsolat</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-lg text-gray-600">
              Kérdése van? Szívesen segítünk! Vegye fel velünk a kapcsolatot az alábbi
              elérhetőségek egyikén.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact info */}
            <div>
              <h2 className="font-bugrino text-2xl uppercase tracking-wider mb-6">Elérhetőségeink</h2>
              <p className="text-gray-600 mb-8">
                Hétfőtől péntekig 9:00 és 18:00 között, hétvégén 10:00 és 16:00 között
                állunk rendelkezésre.
              </p>

              <div className="space-y-6">
                <ContactItem
                  icon={<MapPinIcon />}
                  color="blue"
                  title="Cím"
                >
                  <p>1111 Budapest</p>
                  <p>Példa utca 1.</p>
                </ContactItem>

                <ContactItem
                  icon={<PhoneIcon />}
                  color="yellow"
                  title="Telefon"
                >
                  <a href="tel:+36301234567" className="hover:underline">
                    +36 30 123 4567
                  </a>
                </ContactItem>

                <ContactItem
                  icon={<EnvelopeIcon />}
                  color="red"
                  title="Email"
                >
                  <a href="mailto:info@studyu.hu" className="hover:underline">
                    info@studyu.hu
                  </a>
                </ContactItem>
              </div>

              {/* Opening hours */}
              <BauhausCard padding="md" className="mt-10" accentColor="yellow" hasCornerAccent accentPosition="top-left">
                <h3 className="font-bugrino text-lg uppercase tracking-wider mb-4">Nyitvatartás</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Hétfő - Péntek</span>
                    <span className="font-bugrino">09:00 - 18:00</span>
                  </div>
                  <div className="h-[2px] bg-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Szombat - Vasárnap</span>
                    <span className="font-bugrino">10:00 - 16:00</span>
                  </div>
                </div>
              </BauhausCard>

              {/* Social links */}
              <div className="mt-10">
                <h3 className="font-bugrino text-lg uppercase tracking-wider mb-4">Közösségi média</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                    style={{ boxShadow: '3px 3px 0 var(--bauhaus-blue)' }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                    style={{ boxShadow: '3px 3px 0 var(--bauhaus-red)' }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-right">
              <h2 className="font-bugrino text-2xl uppercase tracking-wider mb-2">Üzenetküldés</h2>
              <p className="text-sm text-gray-600 mb-8">
                Töltse ki az alábbi űrlapot és hamarosan felvesszük Önnel a kapcsolatot.
              </p>

              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                    Név
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    placeholder="Teljes név"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    placeholder="pelda@email.hu"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                    Telefonszám (opcionális)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    placeholder="+36 30 123 4567"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                    Üzenet
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
                    placeholder="Írja le kérdését vagy kérését..."
                  />
                </div>

                <BauhausButton type="submit" variant="primary" fullWidth>
                  Üzenet küldése
                </BauhausButton>
              </form>
            </BauhausCard>
          </div>

          {/* Map placeholder */}
          <div className="mt-16">
            <h2 className="font-bugrino text-2xl uppercase tracking-wider mb-6">Térkép</h2>
            <div
              className="aspect-[16/9] w-full border-[3px] border-black flex items-center justify-center"
              style={{ boxShadow: '6px 6px 0 var(--bauhaus-black)' }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--bauhaus-red)' }}
                >
                  <MapPinIcon className="h-10 w-10 text-white" />
                </div>
                <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">Térkép helye</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactItem({
  icon,
  color,
  title,
  children,
}: {
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'red'
  title: string
  children: React.ReactNode
}) {
  const colors = {
    blue: 'var(--bauhaus-blue)',
    yellow: 'var(--bauhaus-yellow)',
    red: 'var(--bauhaus-red)',
  }

  return (
    <div className="flex gap-4">
      <div
        className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colors[color] }}
      >
        <span className={color === 'yellow' ? 'text-black' : 'text-white'}>
          {icon}
        </span>
      </div>
      <div>
        <p className="font-bugrino text-xs uppercase tracking-wider text-gray-500 mb-1">{title}</p>
        <div className="text-gray-900">{children}</div>
      </div>
    </div>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}
