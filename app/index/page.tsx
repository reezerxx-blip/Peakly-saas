'use client';

import Link from 'next/link';
import { TrendingUp, Zap, BarChart3, Bell, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Qu'est-ce que Peakly ?",
      answer:
        "Peakly est une plateforme IA pour découvrir, suivre et analyser les outils IA en tendance. Nous fournissons des signaux en temps réel, des métriques et des actualités pour garder une longueur d'avance.",
    },
    {
      question: 'À quelle fréquence les données sont-elles mises à jour ?',
      answer:
        'Nos métriques et signaux de tendance sont mis à jour chaque jour, et les actualités toutes les heures. Les abonnés premium reçoivent des mises à jour en temps réel.',
    },
    {
      question: 'Existe-t-il une formule gratuite ?',
      answer:
        'Oui. Le plan gratuit inclut les tendances, les catégories et les détails des outils. Les fonctions premium comme les alertes personnalisées et les filtres avancés demandent un abonnement Pro.',
    },
    {
      question: 'Puis-je configurer des alertes personnalisées ?',
      answer:
        "Les alertes personnalisées sont réservées à Peakly Pro. Vous pouvez suivre jusqu'à 50 outils et recevoir des notifications sur les changements de tendance.",
    },
    {
      question: 'Comment calculez-vous les scores de tendance ?',
      answer:
        "Les scores sont calculés via une analyse machine learning de la couverture média, du sentiment utilisateur, du taux d'adoption et de la croissance mensuelle sur plusieurs sources.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/trends" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-foreground">Peakly</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">
              Tarifs
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trends"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Ouvrir l&apos;app
            </Link>
            <Link
              href="/auth?tab=signin"
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/40 mb-6">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-semibold text-accent-foreground">Découvrez les tendances IA en premier</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
            Peakly détecte les gagnants IA avant tout le monde
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Dashboard ultra-visuel, signaux réels multi-sources, alertes premium et opportunités
            business. Transforme les tendances IA en décisions produit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/trends"
              className="px-8 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-semibold"
            >
              Explorer les tendances
            </Link>
            <Link
              href="/auth?tab=signup"
              className="px-8 py-3 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors font-semibold"
            >
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Outils suivis', value: '50+' },
            { label: 'Sources monitorées', value: '8+' },
            { label: 'Score mis à jour', value: '24h' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-card p-5 text-center">
              <div className="text-3xl font-bold text-accent">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hero panel */}
        <div className="mt-6 h-64 md:h-80 rounded-xl border border-white/10 bg-gradient-to-b from-accent/15 to-background flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-muted-foreground text-lg">Le radar SaaS IA des builders</div>
            <div className="text-3xl font-bold text-accent mt-2">Signaux actionnables, pas du bruit</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Fonctionnalites puissantes</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: BarChart3,
              title: 'Analytique de tendance',
              description: 'Scores et signaux en temps réel pour 50+ outils IA',
            },
            {
              icon: TrendingUp,
              title: 'Détection des signaux',
              description: 'Catégories de signaux: rupture, hausse, stable et baisse',
            },
            {
              icon: Bell,
              title: 'Alertes intelligentes',
              description: 'Soyez notifié quand les tendances ou métriques évoluent (Pro)',
            },
            {
              icon: BarChart3,
              title: 'Dashboard métriques',
              description: 'Suivez adoption, sentiment utilisateur et croissance mensuelle',
            },
            {
              icon: Zap,
              title: 'Recherche rapide',
              description: 'Trouvez vite des outils par catégorie, tendance ou métriques',
            },
            {
              icon: Lock,
              title: 'Fonctions premium',
              description: "Filtrage avancé et configuration d'alertes personnalisées",
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-lg border border-border bg-card hover:border-accent transition-colors">
              <feature.icon className="w-8 h-8 text-accent mb-4" />
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Tarifs simples</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-lg border border-border bg-card">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-muted-foreground mb-6">Idéal pour valider tes hypothèses rapidement</p>

            <div className="text-4xl font-bold mb-8">
              0 EUR<span className="text-lg text-muted-foreground">/mois</span>
            </div>

            <ul className="space-y-3 mb-8">
              {['Accès aux tendances', 'Parcourir 50+ outils', 'Voir les catégories', 'Lire les actualités'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>

            <Link
              href="/auth?tab=signup"
              className="w-full block text-center px-4 py-3 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors font-semibold"
            >
              Commencer
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-lg border-2 border-accent bg-card relative shadow-[0_0_40px_rgba(14,165,233,0.15)]">
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg rounded-tr-lg bg-accent text-accent-foreground text-sm font-semibold">
              Populaire
            </div>

            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-6">Pour les fondateurs, PM et growth teams</p>

            <div className="text-4xl font-bold mb-8">
              9 EUR<span className="text-lg text-muted-foreground">/mois</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Tout du plan gratuit',
                'Alertes personnalisées (50 outils)',
                'Filtrage avancé',
                'Notifications en temps réel',
                'Accès API',
                'Support prioritaire',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth?tab=signup"
              className="w-full block text-center px-4 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-semibold"
            >
              Démarrer
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Questions fréquentes</h2>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="w-full text-left p-6 rounded-lg border border-border bg-card hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {faq.question}
                </h3>
                <span
                  className="text-accent transition-transform"
                  style={{ transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </span>
              </div>
              {expandedFaq === i && (
                <p className="text-muted-foreground mt-4">{faq.answer}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-lg border border-accent bg-accent/10 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à explorer les tendances IA ?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de passionnes et de professionnels qui utilisent Peakly pour
            garder une longueur d&apos;avance.
          </p>
          <Link
            href="/trends"
            className="inline-block px-8 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-semibold"
          >
            Ouvrir l&apos;app
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
          <p>&copy; 2026 Peakly. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
