import { Navigation } from '@/components/navigation';
import { CategoriesPremium } from '@/components/categories-premium';
import { getRequestLanguage } from '@/lib/i18n-server';
import { getTools } from '@/lib/get-tools';

export const metadata = {
  title: 'Categories - Peakly',
  description: 'Parcourez les outils IA par categories avec visualisation des tendances',
};

export default async function CategoriesPage() {
  const lang = await getRequestLanguage();
  const tools = await getTools();

  return (
    <div className="min-h-screen bg-[#080810] text-foreground">
      <Navigation />
      <CategoriesPremium tools={tools} lang={lang} />
    </div>
  );
}
