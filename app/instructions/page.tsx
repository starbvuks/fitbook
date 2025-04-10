import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Download, Pencil, Share2, Trash2 } from 'lucide-react'

export default function InstructionsPage() {
  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-left mb-10 text-accent-purple-dark">How to Use Fitbook</h1>

        <div className="space-y-12">
          {/* Step 1: Adding Items */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
              Add Your Wardrobe Items
            </h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Start by populating your digital wardrobe. Navigate to the <Link href="/catalog" className="link">My Catalog</Link> page.
              </p>
              <ol className="list-decimal list-inside space-y-3 pl-2 text-muted-foreground">
                <li>Click the &quot;Add Item&quot; button.</li>
                <li>Fill in the item details: Name, Category, Brand, Color, Material, Purchase Date, and Price.</li>
                <li>
                  <strong>Categories:</strong> Choose from Headwear, Outerwear, Tops, Bottoms, Shoes, or Accessories.
                </li>
                <li>
                  <strong>Adding Images:</strong> You can either upload images directly from your device or paste image URLs.
                  Multiple images are supported! The first image will be used as the primary thumbnail.
                </li>
                <li><strong>Purchase URL:</strong> Add a link to where you bought the item (optional).</li>
                <li><strong>Tags:</strong> Add relevant tags (e.g., &quot;summer&quot;, &quot;formal&quot;, &quot;cotton&quot;) to help with filtering later.</li>
                <li><strong>Is Owned?:</strong> Check this box if you currently own the item. Uncheck it for items on your wishlist.</li>
              </ol>
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft overflow-hidden">
                <Image
                  src="/instructions/add-item.png"
                  alt="Add Item Screen"
                  width={800}
                  height={400}
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Managing Catalog */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
              Manage Your Catalog
            </h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                On the <Link href="/catalog" className="link">My Catalog</Link> page, you can view, search, filter, and edit your items.
              </p>
              <ul className="space-y-3 pl-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Use the search bar and filters (Category, Status, Price) to find specific items.</span>
                </li>
                 <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Click on any item card to view its details and edit it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Toggle the view mode (large grid, small grid, list) using the icons in the top right.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Quickly toggle the &quot;Owned&quot; status directly from the item card using the shopping cart icon.</span>
                </li>
              </ul>
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft overflow-hidden">
                 <Image
                  src="/instructions/my-catalog-screen.png"
                  alt="My Catalog Screen"
                  width={800}
                  height={450}
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </section>

          {/* Step 3: Creating Outfits */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
              Create Outfits
            </h2>
             <div className="space-y-6">
              <p className="text-muted-foreground">
                Navigate to the <Link href="/outfits" className="link">My Outfits</Link> page and click &quot;Create Outfit&quot;.
              </p>
               <ol className="list-decimal list-inside space-y-3 pl-2 text-muted-foreground">
                <li>Give your outfit a name at the top.</li>
                <li>On the left, you&apos;ll see your catalog items. Use search and category filters to find items quickly.</li>
                <li>
                  <strong>Drag and Drop:</strong> Simply drag items from the catalog (left) and drop them into the corresponding slots (Headwear, Outerwear, Top, Bottom, etc.) on the right.
                  Drop accessories into the dedicated accessories area.
                </li>
                <li>The total cost of the outfit updates automatically in the top right of the builder.</li>
                <li>Click the <span className="inline-flex items-center justify-center bg-card border border-border rounded px-1 py-0.5 mx-0.5"><Download className="w-3 h-3"/></span> icon to download an image of your composed outfit.</li>
                <li>Add optional details like Seasons and Occasions using the selectors.</li>
                <li><strong>Public/Private Setting:</strong> Choose whether your outfit appears on the Discover page for others to see. Private outfits are only visible to you.</li>
                <li>Click &quot;Save Outfit&quot; when you&apos;re done.</li>
              </ol>
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft overflow-hidden">
                 <Image
                  src="/instructions/outfit-builder-dnd.png"
                  alt="Outfit Builder Screen with Drag and Drop"
                  width={800}
                  height={450}
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </section>
          
           {/* Step 4: Managing Outfits */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">4</span>
              Manage Your Outfits
            </h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                The <Link href="/outfits" className="link">My Outfits</Link> page displays all your saved creations.
              </p>
              <ul className="space-y-3 pl-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Use search, filters (Season, Occasion, Price), sorting, and view modes to organize your outfits.</span>
                </li>
                 <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Click on an outfit card to view its details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Use the icons on the outfit card to Edit (<Pencil className="w-3 h-3 inline"/>), Share (<Share2 className="w-3 h-3 inline"/>), or Delete (<Trash2 className="w-3 h-3 inline"/>) an outfit.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Step 5: Discover Community Outfits */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">5</span>
              Discover Community Outfits
            </h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Visit the <Link href="/discover" className="link">Discover</Link> page to explore outfits created by the community.
              </p>
              <ul className="space-y-3 pl-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Browse public outfits shared by other users for inspiration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Search for specific outfits using the search bar at the top.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Upvote outfits you like using the arrow button.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Save outfits to your collection using the bookmark button.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Click on any outfit to view its full details, including all items used.</span>
                </li>
              </ul>
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft overflow-hidden">
                <Image
                  src="/instructions/discover.png"
                  alt="Discover Screen"
                  width={800}
                  height={450}
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </section>

          {/* Step 6: Managing Profile */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">6</span>
              Update Your Profile
            </h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Customize your experience by visiting your <Link href="/profile" className="link">Profile</Link> page.
              </p>
              <ul className="space-y-3 pl-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Update your name, username, bio, location, and website links.</span>
                </li>
                 <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Change your default currency (this affects all price displays).</span>
                </li>
                 <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Manage email notification preferences and profile visibility.</span>
                </li>
                 <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Upload a profile picture.</span>
                </li>
              </ul>
               {/* Optional: Add screenshot of Profile page if available */}
            </div>
          </section>

            <p className="text-muted-foreground mb-4">the website icon used is: fashion by GreenHill from <a href="https://thenounproject.com/browse/icons/term/fashion/" target="_blank" title="fashion Icons">Noun Project</a> (CC BY 3.0)</p>
          <div className="text-center pt-8 border-t border-border">
            <p className="text-muted-foreground mb-4">Ready to get started?</p>
            <Link href="/catalog" className="btn btn-primary py-2 px-4 rounded-full">
              Go to My Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 