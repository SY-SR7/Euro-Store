'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart/cartStore';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const addCartItem = useCartStore((s) => s.addItem);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addCartItem({
      variantId: product.id,
      productId: product.id,
      nameAr: product.name_ar,
      nameEn: product.name_en,
      priceSyp: product.base_price,
      quantity: 1,
      imageUrl: product.primary_image_url
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F0F0F]/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-background-elevated rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 border border-border/50"
            dir="rtl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-20 bg-background/50 hover:bg-background text-text-primary p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-background-secondary relative aspect-square md:aspect-auto">
              <Image
                src={product.primary_image_url || 'https://via.placeholder.com/600'}
                alt={product.name_ar}
                fill
                className="object-cover"
              />
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
              <h2 className="text-3xl font-black text-white mb-2">{product.name_ar}</h2>
              {product.brand?.name && (
                <p className="text-text-secondary uppercase tracking-widest text-sm font-bold mb-4">{product.brand.name}</p>
              )}
              
              <p className="text-primary font-black text-2xl mb-6">
                {product.base_price?.toLocaleString('ar-SY')} ل.س
              </p>

              <p className="text-text-muted mb-8 line-clamp-3 leading-relaxed">
                {product.description_ar || 'تصميم فاخر يجمع بين الأناقة والراحة المطلقة.'}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-[#0F0F0F] font-black py-4 px-6 rounded-xl hover:bg-primary/90 transition-colors flex justify-center items-center gap-2"
                >
                  <ShoppingBag size={20} />
                  إضافة للسلة
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  className="bg-background-secondary border border-border text-white font-bold py-4 px-6 rounded-xl hover:border-primary/50 transition-colors flex justify-center items-center"
                >
                  التفاصيل
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
