/**
 * Product Ratings Service
 * Same weighted-average pattern as store ratings.
 * Requires products table to have: rating FLOAT DEFAULT 0, reviews INTEGER DEFAULT 0
 */

import { supabase } from './supabase';

/**
 * Submit a rating (1–5) for a product.
 * Returns the new average rating, or throws on failure.
 */
export async function submitProductRating(
  productId: string,
  rating: number,
): Promise<{ newRating: number; newReviews: number }> {
  if (!productId) throw new Error('productId is required');
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('التقييم يجب أن يكون بين 1 و 5');
  }

  // Fetch current aggregate
  const { data, error: fetchError } = await supabase
    .from('products')
    .select('rating, reviews')
    .eq('id', productId)
    .single();

  if (fetchError || !data) {
    throw new Error('المنتج غير موجود أو حدث خطأ في الاتصال');
  }

  const currentRating: number = data.rating ?? 0;
  const currentReviews: number = data.reviews ?? 0;
  const newReviews = currentReviews + 1;
  const newRating = (currentRating * currentReviews + rating) / newReviews;

  const { error: updateError } = await supabase
    .from('products')
    .update({ rating: newRating, reviews: newReviews })
    .eq('id', productId);

  if (updateError) {
    throw new Error(updateError.message || 'فشل حفظ التقييم');
  }

  return { newRating, newReviews };
}
