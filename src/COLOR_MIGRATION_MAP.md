# Color Migration Map - Kinderland Website

## Bảng màu mới:
- **Primary Red**: #DB212B (chính)
- **Dark Red**: #B61A23 (hover state)
- **Coral Pink**: #FF7B82 (secondary/accent)
- **Light Pink BG**: #FFF0F1 (backgrounds)
- **Deep Burgundy**: #3F1B1E (dark backgrounds)
- **White**: #FFFFFF (primary background)

## Mapping từ màu cũ sang mới:
```
#7B1B1C → #DB212B (primary red)
#5E1415 → #B61A23 (dark red for hover)
#496C89 → #FF7B82 (coral pink - secondary)
#D3BAA6 → #FF7B82 hoặc white tùy context
#FAF8F5 → #FFFFFF hoặc #FFF0F1 
#F5F0EA → #FFF0F1 (light pink accent bg)
```

## Files cần cập nhật:

### ✅ Đã hoàn thành:
- /styles/globals.css
- /components/shop/ProductCard.tsx
- /components/layout/CartDropdown.tsx

### 🔄 Cần cập nhật (auto-replace với pattern):

**Layout:**
- /components/layout/Navbar.tsx
- /components/layout/Footer.tsx

**Home:**
- /components/home/HomePage.tsx  
- /components/home/AboutSection.tsx
- /components/home/TestimonialsSection.tsx

**Pages:**
- /components/pages/ProductsPage.tsx
- /components/pages/CategoriesPage.tsx
- /components/pages/BrandsPage.tsx
- /components/pages/BlogListPage.tsx
- /components/pages/NewArrivalsPage.tsx
- /components/pages/DiscountsPage.tsx
- /components/pages/StoreFinderPage.tsx

**Cart & Auth:**
- /components/cart/Cart.tsx
- /components/auth/LoginPage.tsx
- /components/checkout/* (tất cả checkout files)

## Ghi chú:
- Primary buttons: gradient from #DB212B to #B61A23
- Hover: reverse gradient
- Text accents: #DB212B
- Backgrounds: #FFF0F1 for soft pink, #FFFFFF for clean white
- Secondary elements: #FF7B82
