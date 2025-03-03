# API Documentation

## Overview

Fitbook's API is built using Next.js API routes and follows RESTful principles. All endpoints are protected by authentication unless explicitly marked as public.

## Base URL

```
/api
```

## Authentication

All protected endpoints require a valid session cookie obtained through NextAuth.js authentication.

### Error Responses

```typescript
{
  error: string
  details?: string | object
  status: number
}
```

## Endpoints

### Authentication

#### GET /api/auth/session
Returns the current session information.

**Response**
```typescript
{
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  expires: string
}
```

### User Profile

#### GET /api/profile
Returns the current user's profile information.

**Response**
```typescript
{
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  pinterest: string | null
  tiktok: string | null
  currency: Currency
  language: string
  emailNotifications: boolean
  publicProfile: boolean
  darkMode: boolean
  stats: {
    itemCount: number
    outfitCount: number
    lookbookCount: number
    totalSpent: number
    mostExpensiveItem: number
  }
}
```

#### PUT /api/profile
Updates the current user's profile information.

**Request Body**
```typescript
{
  name?: string
  username?: string
  bio?: string
  location?: string
  website?: string
  instagram?: string
  pinterest?: string
  tiktok?: string
  currency?: Currency
  language?: string
  emailNotifications?: boolean
  publicProfile?: boolean
  darkMode?: boolean
  image?: string
}
```

### Wardrobe Items

#### GET /api/items
Returns a list of wardrobe items.

**Query Parameters**
- `category`: Filter by category
- `search`: Search term for name, brand, or tags

**Response**
```typescript
Array<{
  id: string
  name: string
  category: ClothingCategory
  brand?: string
  price: number
  purchaseUrl?: string
  size?: string
  material?: string
  condition?: string
  isOwned: boolean
  seasons: string[]
  occasions: string[]
  tags: string[]
  notes?: string
  images: Array<{
    url: string
    publicId: string
    colors: Array<{
      hex: string
      prevalence: number
    }>
    isPrimary: boolean
  }>
  createdAt: string
  updatedAt: string
}>
```

#### POST /api/items
Creates a new wardrobe item.

**Request Body**
```typescript
{
  name: string
  category: ClothingCategory
  brand?: string
  price?: number
  purchaseUrl?: string
  size?: string
  material?: string
  condition?: string
  isOwned?: boolean
  seasons?: string[]
  occasions?: string[]
  tags?: string[]
  notes?: string
  images: Array<{
    url: string
    publicId: string
    colors?: Array<{
      hex: string
      prevalence: number
    }>
    isPrimary?: boolean
  }>
}
```

#### GET /api/items/[id]
Returns a specific wardrobe item.

#### PUT /api/items/[id]
Updates a specific wardrobe item.

#### DELETE /api/items/[id]
Deletes a specific wardrobe item.

### Outfits

#### GET /api/outfits
Returns a list of outfits.

**Query Parameters**
- `search`: Search term for name or tags
- `season`: Filter by season
- `occasion`: Filter by occasion

**Response**
```typescript
Array<{
  id: string
  name: string
  description?: string
  items: Array<{
    id: string
    outfitId: string
    wardrobeItemId: string
    position: string
    wardrobeItem: {
      // Wardrobe item details
    }
  }>
  tags: string[]
  occasions: string[]
  seasons: string[]
  rating?: number
  totalCost: number
  stats?: {
    timesWorn: number
    lastWorn?: string
    favorited: boolean
  }
  createdAt: string
  updatedAt: string
}>
```

#### POST /api/outfits
Creates a new outfit.

**Request Body**
```typescript
{
  name: string
  description?: string
  items: Array<{
    wardrobeItemId: string
    position: string
  }>
  tags?: string[]
  rating?: number
  seasons?: string[]
  occasions?: string[]
}
```

#### GET /api/outfits/[id]
Returns a specific outfit.

#### PUT /api/outfits/[id]
Updates a specific outfit.

#### DELETE /api/outfits/[id]
Deletes a specific outfit.

### Lookbooks

#### GET /api/lookbooks
Returns a list of lookbooks.

**Response**
```typescript
Array<{
  id: string
  name: string
  description?: string
  outfits: Array<{
    // Outfit details
  }>
  tags: string[]
  isPublic: boolean
  stats?: {
    views: number
    likes: number
    shares: number
  }
  createdAt: string
  updatedAt: string
}>
```

#### POST /api/lookbooks
Creates a new lookbook.

**Request Body**
```typescript
{
  name: string
  description?: string
  outfitIds: string[]
  isPublic?: boolean
}
```

#### GET /api/lookbooks/[id]
Returns a specific lookbook.

#### PUT /api/lookbooks/[id]
Updates a specific lookbook.

#### DELETE /api/lookbooks/[id]
Deletes a specific lookbook.

### Image Upload

#### POST /api/upload
Uploads an image to Cloudinary and extracts colors.

**Request Body**
```typescript
FormData with:
- image: File
```

**Response**
```typescript
{
  url: string
  publicId: string
  width: number
  height: number
  format: string
  colors: Array<{
    hex: string
    prevalence: number
  }>
}
```

#### DELETE /api/upload/[publicId]
Deletes an image from Cloudinary.

## Error Handling

All endpoints follow a consistent error handling pattern:

### HTTP Status Codes
- 200: Success
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Validation Errors
```typescript
{
  error: 'Validation error'
  details: {
    [field: string]: {
      message: string
      type: string
    }
  }
}
```

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination using:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
```typescript
{
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
``` 