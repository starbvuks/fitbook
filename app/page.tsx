import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-gradient-from to-background-gradient-to animate-gradient">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_#9B87F5,_transparent_50%)] opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,_#87B9F5,_transparent_50%)] opacity-20" />
        </div>

        {/* Content */}
        <div className="relative px-container">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-16 animate-fade-in">
              manage your fits<br/>
              <span className="text-accent-purple-light">
                build a digital wardrobe
              </span>
            </h1>
            {/* <p className="font-sans text-xl text-foreground-soft max-w-2xl mx-auto mb-12 animate-fade-in">
              Create stunning outfits, build your digital wardrobe, and share your style with the world.
            </p> */}
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
              {session ? (
                <>
                  <Link
                    href="/catalog"
                    className="px-6 py-3 bg-accent-purple text-white rounded-xl font-medium hover:bg-accent-purple-dark transition-colors"
                  >
                    My Catalog
                  </Link>
                  <Link
                    href="/outfits/create"
                    className="px-6 py-3 bg-background-soft border-2 border-border-bright rounded-xl font-medium hover:bg-accent-purple/20 transition-colors"
                  >
                    Create Outfit
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-8 py-4 bg-accent-purple text-white rounded-xl font-medium hover:bg-accent-purple-dark transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/discover"
                    className="px-8 py-4 bg-background-soft border border-border-bright rounded-xl font-medium hover:bg-background-softer transition-colors"
                  >
                    Explore Looks
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {/* <section className="px-container py-32 bg-background-soft">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-16 text-center">
            Everything you need to{' '}
            <span className="text-accent-purple-light">elevate your style</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="👕"
              title="Digital Wardrobe"
              description="Organize your clothes with powerful tagging and search"
              href={session ? "/wardrobe" : "/auth/signin"}
            />
            <FeatureCard
              icon="✨"
              title="Outfit Creator"
              description="Mix and match pieces with our intuitive drag-and-drop interface"
              href={session ? "/outfits/create" : "/auth/signin"}
            />
            <FeatureCard
              icon="🎨"
              title="Color Analysis"
              description="Get smart color combinations and palette suggestions"
              href={session ? "/wardrobe" : "/auth/signin"}
            />
            <FeatureCard
              icon="📱"
              title="Share & Discover"
              description="Show off your style and get inspired by others"
              href="/discover"
            />
            <FeatureCard
              icon="📊"
              title="Style Analytics"
              description="Track your wardrobe stats and wearing patterns"
              href={session ? "/analytics" : "/auth/signin"}
            />
            <FeatureCard
              icon="🌈"
              title="Lookbooks"
              description="Create collections of your favorite outfit combinations"
              href={session ? "/lookbooks" : "/auth/signin"}
            />
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className="relative px-container py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-accent-blue/5" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-8">
            Ready to transform your wardrobe?
          </h2>
          <p className="text-xl text-foreground-soft mb-12">
            Join thousands of fashion enthusiasts and start your style journey today.
          </p>
          {session ? (
            <Link
              href="/catalog"
              className="px-8 py-4 bg-accent-purple text-white rounded-xl font-medium hover:bg-accent-purple-dark transition-colors"
            >
              Go to My Catalog
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-accent-purple text-white rounded-xl font-medium hover:bg-accent-purple-dark transition-colors"
            >
              Start Free
            </Link>
          )}
        </div>
      </section> */}
    </>
  );
}

function FeatureCard({ icon, title, description, href }: { 
  icon: string
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block group p-8 rounded-2xl bg-gray-900 hover:bg-background-softer transition-all duration-300 animate-fade-in hover:scale-[1.02]"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="font-sans text-foreground-soft">{description}</p>
    </Link>
  );
}
