import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, Flame, Mail, Shirt, Sparkles, Watch } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTopBar } from '../../components/AppTopBar';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';

type HeroBanner = { id: string; imageUrl: string; title: string; subtitle: string; ctaUrl: string; ctaLabel: string };
type Brand = { id: string; name: string; slug: string; logo_url: string | null };
type ProductWithCategory = ProductCardProps & { categorySlug: string; nameAr: string };
type HomeProduct = {
  id: string; slug: string; name_ar: string; name_en: string; minPrice: number; comparePrice: number | null;
  image_url: string; total_stock: number; default_variant_id: string | null; variants_count: number;
  is_new: boolean; discount_percentage: number | null; categories?: { slug: string } | null;
};
type StorefrontHomeResponse = {
  products: HomeProduct[];
  banners: Array<Record<string, unknown>>;
  brands: Brand[];
  categories: Array<{ id: string; slug: string }>;
};

const CATEGORY_SHOWCASE = [
  { slug: 'footwear', titleAr: 'سنيكرز وأحذية رياضية', titleEn: 'Luxury Sneakers & Footwear', subtitleAr: 'أديداس، نايك، نيو بالانس، بوما، كونفرس', subtitleEn: 'Adidas, Nike, New Balance, Puma, Converse', badgeAr: 'الأكثر طلباً', badgeEn: 'Best Seller', image: 'https://m.media-amazon.com/images/I/71M4f912LrL._AC_SL1500_.jpg', colors: ['#FFFDF9', '#F5EFE0'] as const, badge: '#FEF3C7', badgeText: '#92400E' },
  { slug: 'perfumes-beauty', titleAr: 'عطور عالمية فاخرة', titleEn: 'Iconic Luxury Fragrances', subtitleAr: 'ديور، شانيل، فرزاتشي، برادا، غوتشي', subtitleEn: 'Dior, Chanel, Versace, Prada, Gucci', badgeAr: 'أصلية 100%', badgeEn: '100% Authentic', image: 'https://m.media-amazon.com/images/I/51Hxl7J1jzL._AC_SL1500_.jpg', colors: ['#FFFDF9', '#EBE7DF'] as const, badge: '#F3E8FF', badgeText: '#6B21A8' },
  { slug: 'mens', titleAr: 'أزياء وقمصان بولو', titleEn: 'Classic Apparel & Polos', subtitleAr: 'لاكوست، تومي هيلفيغر، رالف لورين، بوس', subtitleEn: 'Lacoste, Tommy Hilfiger, Ralph Lauren, Boss', badgeAr: 'تشكيلة راقية', badgeEn: 'Premium Fit', image: 'https://m.media-amazon.com/images/I/61++oCXypXL._AC_SL1500_.jpg', colors: ['#FFFDF9', '#E6EFEA'] as const, badge: '#ECFDF5', badgeText: '#065F46' },
  { slug: 'watches-accessories', titleAr: 'ساعات ونظارات شمسية', titleEn: 'Watches & Sunglasses', subtitleAr: 'ريبان، كاسيو جي شوك، أحزمة جلدية', subtitleEn: 'Ray-Ban, Casio G-Shock, Leather Belts', badgeAr: 'إكسسوارات', badgeEn: 'Accessories', image: 'https://m.media-amazon.com/images/I/61g6yHKxg0L._AC_SL1500_.jpg', colors: ['#FFFDF9', '#EEE5F7'] as const, badge: '#EEF2FF', badgeText: '#3730A3' },
  { slug: 'bags-leather', titleAr: 'حقائب وجلديات فاخرة', titleEn: 'Luxury Handbags & Leather', subtitleAr: 'مايكل كورس، تومي، تشكيلة السفر والأناقة', subtitleEn: 'Michael Kors, Tommy Hilfiger, Travel & Luxury', badgeAr: 'فاخر', badgeEn: 'Luxury', image: 'https://m.media-amazon.com/images/I/71B1hp5wMAL._AC_SL1500_.jpg', colors: ['#FFFDF9', '#F2EADB'] as const, badge: '#FEF2F2', badgeText: '#991B1B' },
] as const;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.max(544, Math.min((height - insets.top) * 0.82, 864));
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const heroScroll = useRef<ScrollView>(null);
  const { isAr, l, t } = usePreferences();

  const loadHome = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    try {
      const result = await apiFetch<StorefrontHomeResponse>('/api/storefront/home');
      const normalized = result.products.map((raw): ProductWithCategory => ({
        id: raw.id,
        slug: raw.slug,
        title: isAr ? raw.name_ar : (raw.name_en || raw.name_ar),
        secondaryTitle: isAr ? raw.name_en : raw.name_ar,
        nameAr: raw.name_ar ?? '',
        price: Number(raw.minPrice ?? 0),
        comparePrice: raw.comparePrice,
        imageUrl: raw.image_url ?? '',
        maxQuantity: Number(raw.total_stock ?? 0),
        variantId: raw.default_variant_id,
        hasMultipleVariants: raw.variants_count > 1,
        variantCount: raw.variants_count,
        isNew: raw.is_new,
        discountPercentage: raw.discount_percentage,
        categorySlug: raw.categories?.slug ?? '',
      }));
      setProducts(normalized);
      setBrands(result.brands);
      setBanners(result.banners.filter((item) => item.is_active !== false && typeof (item.mobile_image_url ?? item.image_url) === 'string').sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)).map((banner, index) => ({ id: String(banner.id ?? index), imageUrl: String(banner.mobile_image_url ?? banner.image_url), title: String((isAr ? banner.title_ar : banner.title_en) ?? l('منتجات مختارة لحياة يومية أجمل', 'Selected products for a better everyday life')), subtitle: String((isAr ? banner.subtitle_ar : banner.subtitle_en) ?? l('خامات واضحة، مقاسات فعلية، مخزون مباشر، ودفع عند الاستلام.', 'Clear materials, real sizes, live stock, and cash on delivery.')), ctaUrl: typeof banner.cta_url === 'string' && banner.cta_url.startsWith('/') ? banner.cta_url : '/products', ctaLabel: String((isAr ? banner.cta_label_ar : banner.cta_label_en) ?? l('استكشف الكتالوج', 'Explore catalog')) })));
      setActiveBanner(0);
    } catch { setError(true); } finally { setLoading(false); setRefreshing(false); }
  }, [isAr, l]);

  useEffect(() => { void loadHome(); }, [loadHome]);
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setActiveBanner((current) => { const next = (current + 1) % banners.length; heroScroll.current?.scrollTo({ x: next * width, animated: true }); return next; }), 7000);
    return () => clearInterval(timer);
  }, [banners.length, width]);

  function openCategory(slug: string, title: string) { router.push({ pathname: '/categories/[slug]', params: { slug, title } }); }
  function moveHero(direction: number) { const next = (activeBanner + direction + banners.length) % banners.length; setActiveBanner(next); heroScroll.current?.scrollTo({ x: next * width, animated: true }); }
  function onHeroScroll(event: NativeSyntheticEvent<NativeScrollEvent>) { setActiveBanner(Math.max(0, Math.min(Math.round(event.nativeEvent.contentOffset.x / width), banners.length - 1))); }
  async function joinNewsletter() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      await apiFetch('/api/storefront/newsletter', { method: 'POST', body: JSON.stringify({ email, locale: isAr ? 'ar' : 'en', source: 'mobile' }) });
      setJoined(true);
    } catch {
      setError(true);
    }
  }
  const categoryProducts = (slugs: string[], words: string[]) => products.filter((product) => slugs.includes(product.categorySlug) || words.some((word) => product.nameAr.includes(word)));
  const sections = [
    { key: 'sneakers', eyebrow: l('أيقونات الشارع الرياضي', 'Iconic Footwear'), title: l('أشهر السنيكرز والأحذية الرياضية العالمية', 'World Best-Selling Sneakers'), subtitle: l('موديلات أديداس، نايك، نيو بالانس وبوما الأصلية 100% المستوردة من أوروبا', '100% authentic Adidas, Nike, New Balance and Puma directly from Europe'), action: l('عرض كافة الأحذية', 'View All Sneakers'), slug: 'footwear', Icon: Flame, limit: 6, data: categoryProducts(['footwear', 'sneakers'], ['حذاء']) },
    { key: 'fragrance', eyebrow: l('عطور النخبة الأوروبية', 'Haute Parfumerie'), title: l('جناح العطور العالمية الفاخرة والأصلية', 'Authentic Luxury Fragrances'), subtitle: l('ديور، شانيل، فرزاتشي، برادا، وغوتشي — عبق الفخامة بتركيز أو دو بارفان الأصلي 100%', 'Dior, Chanel, Versace, Prada & Gucci — 100% Authentic Eau de Parfum'), action: l('تصفح كافة العطور', 'Explore All Fragrances'), slug: 'perfumes-beauty', Icon: Award, limit: 5, data: categoryProducts(['perfumes-beauty', 'perfumes'], ['عطر']) },
    { key: 'apparel', eyebrow: l('أناقة الأزياء الأوروبية', 'Apparel & Polos'), title: l('قمصان بولو وملابس الماركات العالمية', 'Designer Polos & Premium Apparel'), subtitle: l('لاكوست، تومي هيلفيغر، رالف لورين، وبوس — خامات قطن فاخرة وقصات أصلية', 'Lacoste, Tommy Hilfiger, Ralph Lauren & Boss — Luxury Cotton & Timeless Fits'), action: l('عرض كافة الملابس', 'View All Apparel'), slug: 'mens', Icon: Shirt, limit: 6, data: categoryProducts(['mens', 'mens-clothing'], ['بولو', 'تيشيرت', 'بنطال', 'جاكيت', 'طقم']) },
    { key: 'accessories', eyebrow: l('الساعات والإكسسوارات', 'Watches & Eyewear'), title: l('نظارات ريبان وساعات كاسيو والإكسسوارات', 'Iconic Watches, Sunglasses & Accessories'), subtitle: l('تشكيلة النظارات الشمسية، ساعات جي شوك، الأحزمة الجلدية والقبعات', 'Ray-Ban Sunglasses, G-Shock Watches, Leather Belts & Caps'), action: l('عرض كافة الإكسسوارات', 'View All Accessories'), slug: 'watches-accessories', Icon: Watch, limit: 8, data: categoryProducts(['watches-accessories', 'accessories', 'bags-leather'], ['نظارة', 'ساعة', 'حزام', 'قبعة', 'حقيبة']) },
  ];

  return <SafeAreaView className="flex-1 bg-background"><AppTopBar />{loading ? <HomeSkeleton heroHeight={heroHeight} /> : error ? <View className="flex-1 items-center justify-center px-8"><Text className="text-center text-lg font-bold text-text-primary">{l('تعذر تحميل المتجر', 'Could not load the store')}</Text><Text className="mt-2 text-center leading-6 text-text-secondary">{l('تحقق من الاتصال ثم حاول مرة أخرى.', 'Check your connection and try again.')}</Text><Pressable accessibilityRole="button" onPress={() => void loadHome()} className="mt-6 min-h-12 items-center justify-center rounded-xl bg-primary px-7"><Text className="font-bold text-[#17130A]">{t('common.retry')}</Text></Pressable></View> : <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadHome(true)} tintColor="#B8860B" colors={['#B8860B']} />} contentContainerStyle={{ paddingBottom: 24 }}>
    {banners.length ? <View style={{ height: heroHeight }} className="relative overflow-hidden bg-black"><ScrollView ref={heroScroll} horizontal pagingEnabled bounces={false} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onHeroScroll} scrollEventThrottle={16}>{banners.map((banner) => <ImageBackground key={banner.id} source={{ uri: banner.imageUrl }} resizeMode="cover" style={{ width, height: heroHeight }} accessibilityLabel={banner.title}><View className="absolute inset-0 bg-black/45" /><View className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-28"><Text className={`text-3xl font-black leading-9 text-white ${isAr ? 'text-right' : 'text-left'}`}>{banner.title}</Text><Text className={`mt-4 text-base leading-7 text-white/85 ${isAr ? 'text-right' : 'text-left'}`}>{banner.subtitle}</Text><Pressable accessibilityRole="button" accessibilityLabel={banner.ctaLabel} onPress={() => router.push(banner.ctaUrl as Href)} className="mt-7 min-h-11 self-start items-center justify-center bg-white px-6 py-3"><Text className="text-sm font-bold text-black">{banner.ctaLabel}</Text></Pressable></View></ImageBackground>)}</ScrollView>{banners.length > 1 ? <View className="absolute bottom-6 end-5 flex-row items-center gap-2"><Pressable accessibilityRole="button" accessibilityLabel={l('السابق', 'Previous')} onPress={() => moveHero(-1)} className="h-10 w-10 items-center justify-center border border-white/50 bg-black/35"><ChevronLeft size={20} color="#FFF" /></Pressable><Text className="min-w-12 text-center text-xs font-bold text-white">{activeBanner + 1} / {banners.length}</Text><Pressable accessibilityRole="button" accessibilityLabel={l('التالي', 'Next')} onPress={() => moveHero(1)} className="h-10 w-10 items-center justify-center border border-white/50 bg-black/35"><ChevronRight size={20} color="#FFF" /></Pressable></View> : null}</View> : null}
    {brands.length ? <View className="border-b border-t border-border bg-background-card/60 py-9"><ContentHeader icon={Sparkles} eyebrow={l('علامات أصلية معتمدة', 'Official Brands')} title={l('العلامات التجارية العالمية', 'World Iconic Brands')} subtitle={l('أشهر الماركات الأوروبية والعالمية الأصلية 100% في مكان واحد', '100% Authentic World-Class Brands in One Place')} action={l('تصفح جميع المنتجات', 'Browse all catalog')} onAction={() => router.push('/products')} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 30, alignItems: 'center' }}>{brands.map((brand) => <Pressable key={brand.id} accessibilityRole="button" accessibilityLabel={brand.name} onPress={() => router.push({ pathname: '/products', params: { brands: brand.slug } })} className="h-16 w-32 items-center justify-center">{brand.logo_url ? <Image source={{ uri: brand.logo_url }} style={{ width: 118, height: 52 }} resizeMode="contain" accessibilityLabel={brand.name} /> : <Text className="text-center text-sm font-black uppercase text-text-primary">{brand.name}</Text>}</Pressable>)}</ScrollView></View> : null}
    <View className="px-4 py-14"><ContentHeader icon={Sparkles} eyebrow={l('تصفح التشكيلات', 'Explore Collections')} title={l('تسوق حسب الأقسام الفاخرة', 'Shop By Luxury Categories')} subtitle={l('استكشف كافة المجموعات الأصلية عبر التصنيفات المعتمدة', 'Browse all authentic collections by department')} action={l('استعراض كافة الأقسام', 'View All Categories')} onAction={() => router.push('/(tabs)/categories')} /><View className="gap-4">{CATEGORY_SHOWCASE.map((category) => <Pressable key={category.slug} accessibilityRole="button" accessibilityLabel={isAr ? category.titleAr : category.titleEn} onPress={() => openCategory(category.slug, isAr ? category.titleAr : category.titleEn)} className="h-52 overflow-hidden rounded-2xl border border-border"><LinearGradient colors={[...category.colors]} className="absolute inset-0" /><View className={`h-full flex-row items-center justify-between p-5 ${isAr ? 'flex-row-reverse' : ''}`}><View className="w-[58%] items-start"><View className="mb-3 rounded-full border border-border px-3 py-1" style={{ backgroundColor: category.badge }}><Text className="text-[10px] font-black" style={{ color: category.badgeText }}>{isAr ? category.badgeAr : category.badgeEn}</Text></View><Text className={`${isAr ? 'text-right' : 'text-left'} text-lg font-black leading-6 text-text-primary`}>{isAr ? category.titleAr : category.titleEn}</Text><Text className={`${isAr ? 'text-right' : 'text-left'} mt-2 text-xs leading-5 text-text-secondary`} numberOfLines={2}>{isAr ? category.subtitleAr : category.subtitleEn}</Text><View className="mt-4 flex-row items-center gap-1"><Text className="text-xs font-bold text-primary">{l('تصفح القسم', 'Shop Now')}</Text>{isAr ? <ArrowLeft size={14} color="#B8860B" /> : <ArrowRight size={14} color="#B8860B" />}</View></View><View className="h-36 w-32 items-center justify-center rounded-2xl border border-border bg-white p-2"><Image source={{ uri: category.image }} className="h-full w-full" resizeMode="contain" accessibilityLabel={isAr ? category.titleAr : category.titleEn} /></View></View></Pressable>)}</View></View>
    {sections.map((section, index) => section.data.length ? <ProductSection key={section.key} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} action={section.action} Icon={section.Icon} products={section.data.slice(0, section.limit)} onAction={() => openCategory(section.slug, section.title)} tinted={index % 2 === 1} /> : null)}
    {products.length ? <ProductSection eyebrow={l('وصل حديثاً', 'Latest Drops')} title={l('أحدث المنتجات المضافة', 'New In EuroStore')} action={l('عرض كافة المنتجات', 'View all products')} products={products.slice(0, 12)} onAction={() => router.push('/products')} /> : null}
    <View className="border-t border-border bg-background-secondary px-4 py-16"><View className="overflow-hidden rounded-[32px] border border-border-accent bg-background-card p-7"><View className="mb-4 self-start flex-row items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2"><Sparkles size={15} color="#B8860B" /><Text className="text-[11px] font-bold text-primary">{l('نادي يورو ستور الذهبي', 'EuroStore VIP Club')}</Text></View><Text className={`${isAr ? 'text-right' : 'text-left'} text-2xl font-black leading-9 text-text-primary`}>{l('احصل على خصم 10% على أول طلب لك', 'Enjoy 10% Off Your Very First Order')}</Text><Text className={`${isAr ? 'text-right' : 'text-left'} mt-3 text-sm leading-6 text-text-secondary`}>{l('اشترك في النشرة الحصرية وكن أول من يعلم بوصول التشكيلات الأوروبية الجديدة والعروض الحصرية.', 'Join our exclusive club to get early access to new European drops & private sales.')}</Text>{joined ? <View className="mt-6 flex-row items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-5"><CheckCircle2 size={28} color="#15803D" /><View className="flex-1"><Text className="font-bold text-emerald-800">{l('تم اشتراكك بنجاح في النادي الذهبي!', 'Welcome to the VIP Club!')}</Text><Text className="mt-1 text-xs text-emerald-700">{l('تم تفعيل كود الخصم EURO10 لحسابك', 'Promo code EURO10 has been activated for you')}</Text></View></View> : <><View className="mt-6 flex-row items-center rounded-2xl border border-border bg-white px-4"><Mail size={19} color="#A8A29E" /><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder={l('أدخل بريدك الإلكتروني...', 'Enter your email address...')} placeholderTextColor="#A8A29E" accessibilityLabel={l('البريد الإلكتروني', 'Email address')} className={`${isAr ? 'text-right' : 'text-left'} min-h-14 flex-1 px-3 text-sm text-text-primary`} /></View><Pressable accessibilityRole="button" accessibilityLabel={l('انضم الآن', 'Join Club')} onPress={() => void joinNewsletter()} className="mt-3 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-8"><Text className="font-black text-black">{l('انضم الآن', 'Join Club')}</Text>{isAr ? <ArrowLeft size={16} color="#000" /> : <ArrowRight size={16} color="#000" />}</Pressable><Text className={`${isAr ? 'text-right' : 'text-left'} mt-3 text-[10px] text-text-muted`}>{l('🔒 نلتزم بحماية خصوصيتك ولا نرسل رسائل مزعجة.', '🔒 We respect your privacy. No spam ever.')}</Text></>}</View></View>
  </ScrollView>}</SafeAreaView>;
}

function ContentHeader({ icon: Icon, eyebrow, title, subtitle, action, onAction }: { icon?: typeof Sparkles; eyebrow: string; title: string; subtitle?: string; action: string; onAction: () => void }) {
  const { isAr } = usePreferences();
  return <View className="mb-7 px-1"><View className="mb-2 flex-row items-center gap-2">{Icon ? <Icon size={15} color="#B8860B" /> : null}<Text className="text-[11px] font-bold tracking-wider text-primary">{eyebrow}</Text></View><Text className={`${isAr ? 'text-right' : 'text-left'} text-2xl font-black leading-8 text-text-primary`}>{title}</Text>{subtitle ? <Text className={`${isAr ? 'text-right' : 'text-left'} mt-2 text-xs leading-5 text-text-secondary`}>{subtitle}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} className="mt-3 self-start flex-row items-center gap-1"><Text className="text-xs font-bold text-primary">{action}</Text>{isAr ? <ArrowLeft size={14} color="#B8860B" /> : <ArrowRight size={14} color="#B8860B" />}</Pressable></View>;
}

function ProductSection({ eyebrow, title, subtitle, action, products, onAction, Icon, tinted = false }: { eyebrow: string; title: string; subtitle?: string; action: string; products: ProductCardProps[]; onAction: () => void; Icon?: typeof Sparkles; tinted?: boolean }) {
  return <View className={`border-t border-border px-4 py-14 ${tinted ? 'bg-[#FAF6EE]' : 'bg-background-card/20'}`}><ContentHeader icon={Icon} eyebrow={eyebrow} title={title} subtitle={subtitle} action={action} onAction={onAction} /><View className="flex-row flex-wrap justify-between">{products.map((product) => <View key={product.id} className="mb-4 w-[48.3%]"><ProductCard {...product} /></View>)}</View></View>;
}

function HomeSkeleton({ heroHeight }: { heroHeight: number }) {
  return <ScrollView className="flex-1" scrollEnabled={false}><View style={{ height: heroHeight }} className="items-center justify-center bg-background-secondary"><ActivityIndicator size="large" color="#B8860B" /></View><View className="px-4 py-8"><View className="mb-4 h-7 w-44 rounded bg-background-secondary" /><View className="flex-row gap-3"><View className="h-48 flex-1 rounded-xl bg-background-secondary" /><View className="h-48 flex-1 rounded-xl bg-background-secondary" /></View></View></ScrollView>;
}
