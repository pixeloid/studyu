import { Metadata } from 'next'
import Link from 'next/link'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

export const metadata: Metadata = {
  title: 'Galéria',
  description: 'Tekintse meg a StudyU Fotóstúdióban készült munkáinkat.',
}

const categories = [
  { id: 'all', name: 'Összes' },
  { id: 'portrait', name: 'Portré' },
  { id: 'product', name: 'Termék' },
  { id: 'fashion', name: 'Divat' },
  { id: 'studio', name: 'Stúdió' },
]

const images = [
  { id: 1, category: 'studio', title: 'Stúdió belső tér', placeholder: true },
  { id: 2, category: 'studio', title: 'Világítás beállítás', placeholder: true },
  { id: 3, category: 'portrait', title: 'Portré fotózás', placeholder: true },
  { id: 4, category: 'fashion', title: 'Divat fotózás', placeholder: true },
  { id: 5, category: 'product', title: 'Termékfotózás', placeholder: true },
  { id: 6, category: 'studio', title: 'Sminkasztal', placeholder: true },
  { id: 7, category: 'portrait', title: 'Üzleti portré', placeholder: true },
  { id: 8, category: 'product', title: 'Ékszer fotózás', placeholder: true },
  { id: 9, category: 'fashion', title: 'Lookbook', placeholder: true },
]

export default function GalleryPage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* Geometric decorations */}
        <div
          className="absolute top-10 left-10 w-24 h-24 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div
          className="absolute bottom-20 right-20 w-16 h-16 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Galéria</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-lg text-gray-600">
              Fedezze fel stúdiónkat és tekintse meg az itt készült munkáinkat.
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className={`
                px-5 py-2 font-bugrino text-sm uppercase tracking-wider border-[3px] border-black
                transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]
                ${category.id === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-50'
                }
              `}
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const colors = ['var(--bauhaus-blue)', 'var(--bauhaus-yellow)', 'var(--bauhaus-red)']
            const shadowColor = colors[index % 3]

            return (
              <div
                key={image.id}
                className="group relative aspect-[4/3] overflow-hidden border-[3px] border-black bg-white transition-all hover:translate-x-[-4px] hover:translate-y-[-4px]"
                style={{ boxShadow: `6px 6px 0 ${shadowColor}` }}
              >
                {/* Placeholder for actual images */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <div
                      className="mx-auto w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center mb-3"
                      style={{ backgroundColor: shadowColor }}
                    >
                      <svg
                        className={`h-8 w-8 ${shadowColor === 'var(--bauhaus-yellow)' ? 'text-black' : 'text-white'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                    </div>
                    <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">
                      {image.title}
                    </p>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/80 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                  <div className="text-center">
                    <span className="font-bugrino text-lg uppercase tracking-wider text-white">
                      {image.title}
                    </span>
                    <div className="mt-3 flex justify-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info banner */}
      <div className="relative overflow-hidden py-16" style={{ backgroundColor: 'var(--bauhaus-black)' }}>
        {/* Geometric decorations */}
        <div
          className="absolute top-4 left-4 w-12 h-12 rounded-full opacity-30"
          style={{ backgroundColor: 'var(--bauhaus-blue)' }}
        />
        <div
          className="absolute bottom-4 right-4 w-12 h-12 rotate-45 opacity-30"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-white text-lg mb-8">
              Szeretné látni stúdiónkat élőben? Egyeztessen velünk egy személyes
              megtekintést, vagy foglaljon időpontot online!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/kapcsolat">
                <BauhausButton variant="accent" size="lg">Kapcsolatfelvétel</BauhausButton>
              </Link>
              <Link href="/foglalas">
                <BauhausButton variant="primary" size="lg">Foglalás</BauhausButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
