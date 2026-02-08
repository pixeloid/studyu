'use client';

import { useState } from 'react';
import {
  BauhausButton,
  BauhausCard,
  BauhausInput,
  BauhausCalendarDay,
  BauhausBadge,
  BauhausHero,
  BauhausModal,
  BauhausGeometric,
} from '@/components/ui/bauhaus';
import { BauhausDecoration } from '@/components/ui/bauhaus/BauhausGeometric';

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <BauhausHero
        title="Bauhaus Design System"
        subtitle="Dugattyus.hu inspirálta UI komponensek"
      >
        <BauhausButton variant="accent" size="lg">
          Felfedezés
        </BauhausButton>
      </BauhausHero>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* Color Palette */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Színpaletta</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div
                className="h-24 border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-blue)' }}
              />
              <p className="font-bugrino text-sm uppercase">Blue</p>
              <p className="text-xs text-gray-500">#0000FF</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-red)' }}
              />
              <p className="font-bugrino text-sm uppercase">Red</p>
              <p className="text-xs text-gray-500">#E53935</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              />
              <p className="font-bugrino text-sm uppercase">Yellow</p>
              <p className="text-xs text-gray-500">#F5A623</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-black)' }}
              />
              <p className="font-bugrino text-sm uppercase">Black</p>
              <p className="text-xs text-gray-500">#000000</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 border-[3px] border-black bg-white"
              />
              <p className="font-bugrino text-sm uppercase">White</p>
              <p className="text-xs text-gray-500">#FFFFFF</p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Typography */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Tipográfia</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2 uppercase">Display</p>
              <p className="text-bauhaus-display">Bauhaus</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2 uppercase">Heading</p>
              <p className="text-bauhaus-heading">Geometrikus Formák</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2 uppercase">Subheading</p>
              <p className="text-bauhaus-subheading">Modernista Dizájn Elvek</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2 uppercase">Body (Inter)</p>
              <p className="text-base leading-relaxed">
                A Bauhaus művészeti iskola 1919-ben alakult Weimarban, és forradalmasította
                a modern dizájn szemléletét. Az „A forma követi a funkciót" elv máig meghatározó.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Buttons */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Gombok</h2>
          <div className="flex flex-wrap gap-4">
            <BauhausButton variant="default">Default</BauhausButton>
            <BauhausButton variant="primary">Primary</BauhausButton>
            <BauhausButton variant="accent">Accent</BauhausButton>
            <BauhausButton variant="danger">Danger</BauhausButton>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <BauhausButton size="sm">Small</BauhausButton>
            <BauhausButton size="md">Medium</BauhausButton>
            <BauhausButton size="lg">Large</BauhausButton>
          </div>
          <div className="mt-6">
            <BauhausButton disabled>Disabled</BauhausButton>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Cards */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Kártyák</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <BauhausCard>
              <h3 className="font-bugrino text-xl uppercase mb-2">Alap Kártya</h3>
              <p className="text-sm text-gray-600">
                Egyszerű kártya offset árnyékkal és fekete kerettel.
              </p>
            </BauhausCard>

            <BauhausCard accentColor="red" hasCornerAccent>
              <h3 className="font-bugrino text-xl uppercase mb-2">Piros Akcentus</h3>
              <p className="text-sm text-gray-600">
                Kártya geometrikus dekorációval a sarokban.
              </p>
            </BauhausCard>

            <BauhausCard accentColor="yellow" hasCornerAccent accentPosition="top-left">
              <h3 className="font-bugrino text-xl uppercase mb-2">Sárga Akcentus</h3>
              <p className="text-sm text-gray-600">
                Kártya bal felső sarokra pozicionált dekorációval.
              </p>
            </BauhausCard>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Inputs */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Input Mezők</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
            <BauhausInput
              label="Név"
              placeholder="Írd be a neved..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <BauhausInput
              label="Email"
              placeholder="email@example.com"
              type="email"
            />
            <BauhausInput
              label="Hibás mező"
              placeholder="..."
              error="Kötelező mező"
            />
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Calendar Days */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Naptár Napok</h2>
          <p className="text-gray-600 mb-6">Dugattyus.hu stílusú naptár komponensek</p>

          <div
            className="p-8 overflow-x-auto"
            style={{ backgroundColor: 'var(--bauhaus-blue)' }}
          >
            <div className="flex gap-4 min-w-max">
              <BauhausCalendarDay
                day={3}
                dayName="Kedd"
                accentColor="red"
                events={['Inga x Dugattyús', 'Tiltott rengeteg']}
              />
              <BauhausCalendarDay
                day={4}
                dayName="Szerda"
                accentColor="none"
                events={['Éjszakák', 'És nappalok']}
              />
              <BauhausCalendarDay
                day={5}
                dayName="Csütörtök"
                accentColor="yellow"
                events={['Kiszel Tünde', 'Naptár dedikálás']}
              />
              <BauhausCalendarDay
                day={6}
                dayName="Péntek"
                accentColor="red"
                events={['Influest', 'Pure Lust']}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Badges */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Badge-ek</h2>
          <div className="flex flex-wrap gap-4">
            <BauhausBadge variant="red">Új</BauhausBadge>
            <BauhausBadge variant="yellow">Kiemelt</BauhausBadge>
            <BauhausBadge variant="blue">Info</BauhausBadge>
            <BauhausBadge variant="black">Kategória</BauhausBadge>
            <BauhausBadge variant="outline">Outline</BauhausBadge>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Geometric Shapes */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Geometrikus Elemek</h2>
          <div className="flex flex-wrap items-center gap-8">
            <BauhausGeometric shape="circle" color="red" size={60} />
            <BauhausGeometric shape="circle" color="yellow" size={48} />
            <BauhausGeometric shape="circle" color="blue" size={36} />
            <BauhausGeometric shape="square" color="black" size={50} />
            <BauhausGeometric shape="square" color="red" size={40} rotate={45} />
            <BauhausGeometric shape="triangle" color="yellow" size={60} />
            <BauhausGeometric shape="triangle-right" color="black" size={50} />
          </div>

          <div className="mt-8">
            <h3 className="font-bugrino text-lg uppercase mb-4">Dekorációk</h3>
            <div className="space-y-6">
              <BauhausDecoration variant="corner" />
              <BauhausDecoration variant="accent" />
            </div>
          </div>
        </section>

        {/* Divider */}
        <BauhausDecoration variant="divider" />

        {/* Modal */}
        <section>
          <h2 className="text-bauhaus-heading mb-8">Modal</h2>
          <BauhausButton onClick={() => setIsModalOpen(true)}>
            Modal Megnyitása
          </BauhausButton>

          <BauhausModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Bauhaus Modal"
            accentColor="yellow"
          >
            <div className="space-y-4">
              <p>
                Ez egy Bauhaus stílusú modal ablak. Geometrikus formák,
                erős színek és tiszta tipográfia jellemzi.
              </p>
              <BauhausInput label="Példa input" placeholder="Írj valamit..." />
              <div className="flex gap-4 justify-end pt-4">
                <BauhausButton onClick={() => setIsModalOpen(false)}>
                  Mégse
                </BauhausButton>
                <BauhausButton variant="primary" onClick={() => setIsModalOpen(false)}>
                  Mentés
                </BauhausButton>
              </div>
            </div>
          </BauhausModal>
        </section>
      </div>

      {/* Footer */}
      <footer
        className="py-8 text-center"
        style={{ backgroundColor: 'var(--bauhaus-black)' }}
      >
        <p className="font-bugrino text-white uppercase tracking-wider">
          Bauhaus Design System
        </p>
        <BauhausDecoration variant="accent" className="justify-center mt-4" />
      </footer>
    </div>
  );
}
