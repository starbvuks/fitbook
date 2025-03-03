# OutfitBuilder Component Documentation

## Overview

The OutfitBuilder component is a core feature of Fitbook that enables users to create and customize outfits by combining items from their wardrobe. It provides a drag-and-drop interface, color harmony analysis, and style recommendations.

## Component Structure

```typescript
interface OutfitSlot {
  category: ClothingCategory
  item?: ClothingItem
  order: number
  label: string
}

interface OutfitBuilderProps {
  onOutfitChange: (items: ClothingItem[]) => void
}

export default function OutfitBuilder({ onOutfitChange }: OutfitBuilderProps) {
  // Component implementation
}
```

## Features

### 1. Outfit Slots
- Predefined slots for different clothing categories
- Visual indicators for empty/filled slots
- Drag-and-drop support
- Order management

### 2. Item Selection
- Modal-based item picker
- Category filtering
- Search functionality
- Preview capabilities

### 3. Color Analysis
- Real-time color harmony checking
- Complementary color suggestions
- Color palette visualization
- Style recommendations

### 4. Position Management
- Automatic slot assignment
- Position reordering
- Layer management
- Visual arrangement

## Implementation Details

### Slot Configuration
```typescript
const OUTFIT_SLOTS: OutfitSlot[] = [
  { category: 'accessories', order: 1, label: 'Accessories (Head)' },
  { category: 'outerwear', order: 2, label: 'Outerwear' },
  { category: 'tops', order: 3, label: 'Top' },
  { category: 'bottoms', order: 4, label: 'Bottom' },
  { category: 'shoes', order: 5, label: 'Shoes' },
]
```

### State Management
```typescript
// Internal state
const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
const [items, setItems] = useState<(ClothingItem | undefined)[]>(
  Array(OUTFIT_SLOTS.length).fill(undefined)
)
const [showItemPicker, setShowItemPicker] = useState(false)
```

### Item Selection
```typescript
const handleItemSelect = (item: ClothingItem) => {
  if (selectedSlot === null) return

  setItems(prev => {
    const next = [...prev]
    next[selectedSlot] = item
    return next
  })
  
  setShowItemPicker(false)
  setSelectedSlot(null)
  onOutfitChange(items.filter((item): item is ClothingItem => !!item))
}
```

### Drag and Drop
```typescript
const handleDragStart = (e: DragEvent, index: number) => {
  e.dataTransfer.setData('text/plain', index.toString())
}

const handleDrop = (e: DragEvent, targetIndex: number) => {
  e.preventDefault()
  const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
  
  setItems(prev => {
    const next = [...prev]
    ;[next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]]
    return next
  })
}
```

## Usage Example

```typescript
function CreateOutfitPage() {
  const handleOutfitChange = (items: ClothingItem[]) => {
    // Handle outfit changes
  }

  return (
    <div>
      <h1>Create Outfit</h1>
      <OutfitBuilder onOutfitChange={handleOutfitChange} />
    </div>
  )
}
```

## Component API

### Props

| Name | Type | Required | Description |
|------|------|----------|-------------|
| onOutfitChange | `(items: ClothingItem[]) => void` | Yes | Callback when outfit items change |
| initialItems | `ClothingItem[]` | No | Initial outfit items |
| readOnly | `boolean` | No | Disable editing |
| maxItems | `number` | No | Maximum number of items |

### Events

| Name | Description | Parameters |
|------|-------------|------------|
| onSlotClick | Fired when a slot is clicked | `(index: number) => void` |
| onItemRemove | Fired when an item is removed | `(item: ClothingItem) => void` |
| onDragStart | Fired when dragging starts | `(e: DragEvent, index: number) => void` |
| onDrop | Fired when item is dropped | `(e: DragEvent, index: number) => void` |

## Styling

### CSS Classes
```typescript
const slotClasses = clsx(
  'relative aspect-square rounded-lg overflow-hidden',
  'border-2 border-dashed',
  {
    'border-border hover:border-accent-purple': !item,
    'border-accent-purple': item,
  }
)

const itemClasses = clsx(
  'absolute inset-0',
  'flex items-center justify-center',
  'bg-background-soft'
)
```

### Theme Integration
- Uses design system colors
- Responsive layout
- Dark mode support
- Accessibility compliance

## Performance Optimization

### Memoization
```typescript
const MemoizedSlot = memo(function Slot({ item, onClick }: SlotProps) {
  return (
    // Slot implementation
  )
})
```

### Loading States
```typescript
if (loading) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-background-soft aspect-square rounded-lg" />
      ))}
    </div>
  )
}
```

### Error Handling
```typescript
if (error) {
  return (
    <div className="text-red-500 bg-red-50 p-4 rounded-lg">
      Failed to load wardrobe items: {error}
    </div>
  )
}
```

## Integration Points

### With Wardrobe
```typescript
const fetchWardrobeItems = async (category?: string) => {
  const response = await fetch(`/api/items${category ? `?category=${category}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch items')
  return response.json()
}
```

### With Color Analysis
```typescript
const analyzeOutfitColors = async (items: ClothingItem[]) => {
  const colors = items.flatMap(item => 
    item.images[0]?.colors || []
  )
  return analyzeColorHarmony(colors)
}
```

## Testing

### Unit Tests
```typescript
describe('OutfitBuilder', () => {
  it('renders empty slots', () => {
    render(<OutfitBuilder onOutfitChange={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('handles item selection', async () => {
    const onOutfitChange = jest.fn()
    render(<OutfitBuilder onOutfitChange={onOutfitChange} />)
    
    // Test implementation
  })
})
```

### Integration Tests
```typescript
describe('OutfitBuilder Integration', () => {
  it('integrates with wardrobe', async () => {
    // Test implementation
  })

  it('integrates with color analysis', async () => {
    // Test implementation
  })
})
```

## Known Issues

1. **Drag and Drop on Mobile**
   - Limited support on some mobile browsers
   - Touch events need improvement
   - Solution: Implement custom touch handlers

2. **Performance with Many Items**
   - Slow loading with large wardrobes
   - Memory usage concerns
   - Solution: Implement virtualization

3. **Color Analysis Delay**
   - Analysis can be slow with many items
   - UI can feel unresponsive
   - Solution: Implement background processing

## Future Improvements

1. **Enhanced Drag and Drop**
   - Better mobile support
   - Visual feedback
   - Animations
   - Multi-select

2. **AI Integration**
   - Style recommendations
   - Automatic outfit generation
   - Color harmony suggestions
   - Weather-based suggestions

3. **Performance**
   - Virtualized item list
   - Optimized image loading
   - Cached color analysis
   - Reduced re-renders

4. **UI Enhancements**
   - 3D view
   - Layer management
   - Advanced filtering
   - Better mobile layout 