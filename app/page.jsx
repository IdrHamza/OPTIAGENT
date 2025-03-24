import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

// Données de produits fictives pour la page d'accueil
const featuredProducts = [
  {
    id: 1,
    name: "Produit A",
    category: "Catégorie 1",
    price: "99,99 €",
    description: "Un produit de qualité supérieure avec des fonctionnalités avancées.",
  },
  {
    id: 2,
    name: "Produit B",
    category: "Catégorie 2",
    price: "149,99 €",
    description: "Notre meilleure vente, idéal pour les professionnels.",
  },
  {
    id: 3,
    name: "Produit C",
    category: "Catégorie 1",
    price: "199,99 €",
    description: "Solution complète pour les entreprises de toutes tailles.",
  },
  {
    id: 4,
    name: "Produit D",
    category: "Catégorie 3",
    price: "49,99 €",
    description: "Option économique avec un excellent rapport qualité-prix.",
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl">OptiAgent</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <ThemeToggle />
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Connexion
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/signup">
            Inscription
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Bienvenue sur OptiAgent
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Gérez vos clients et produits efficacement avec notre plateforme intuitive.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/signup">
                  <Button>Commencer</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Connexion</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-muted/50 dark:bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Notre Catalogue de Produits</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Découvrez notre sélection de produits de qualité
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="aspect-square relative bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground">
                      <span className="text-4xl">📦</span>
                    </div>
                    <p className="text-sm">{product.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="font-bold">{product.price}</span>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link href="/login">
                <Button>Voir tous les produits</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Pourquoi choisir OptiAgent?</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Notre plateforme offre une solution complète pour la gestion de vos clients et produits.
                </p>
                <ul className="grid gap-2">
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Interface intuitive et facile à utiliser</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Gestion complète des clients et produits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Tableau de bord avec statistiques en temps réel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Sécurité et confidentialité des données</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative h-[350px] w-[350px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <span className="text-6xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} OptiAgent. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}

