import { useTranslations } from 'next-intl';
import { Zap, Sun, Battery, Activity, Phone, Mail, MapPin } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <main>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('solutions.title')}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Activity className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                {t('solutions.frequency_regulation')}
              </h3>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                {t('solutions.edreg')}
              </h3>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Sun className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                {t('solutions.solar_storage')}
              </h3>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Battery className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                {t('solutions.re100')}
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('contact.title')}
            </h2>
          </div>
          <div className="mt-12 flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-3 text-gray-600">
              <Phone className="h-6 w-6 text-blue-500" />
              <span>{t('contact.phone')}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail className="h-6 w-6 text-blue-500" />
              <a href={`mailto:${t('contact.email')}`} className="hover:text-blue-600">
                {t('contact.email')}
              </a>
            </div>
            <div className="flex items-center space-x-3 text-gray-600 text-center max-w-lg">
              <MapPin className="h-6 w-6 text-blue-500 flex-shrink-0" />
              <span>{t('contact.address')}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
