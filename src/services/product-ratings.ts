/**
 * Product Ratings Service
 * Supports both new ratings and edits (replacing a previous rating).
 * Requires products table to have: rating FLOAT DEFAULT 0, reviews INTEGER DEFAULT 0
 */

import { supabase } from './supabase';

/**
 * Submit or update a rating (1–5) for a product.
 * - Pass `previousRating` when the user is editing an existing rating.
 *   In edit mode the review count stays the same; the old value is replaced.
 * - Omit `previousRating` for a brand-new rating (review count +1).
 */
export async function submitProductRating(
  productId: string,
  rating: number,
  previousRating?: number,
): Promise<{ newRating: number; newReviews: number }> {
  if (!productId) throw new Error('productId is required');
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('التقييم يجب أن يكون بين 1 و 5');
  }

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

  let newRating: number;
  let newReviews: number;

  if (previousRating !== undefined && currentReviews > 0) {
    // Edit: replace old star value — review count stays the same
    newReviews = currentReviews;
    newRating = (currentRating * currentReviews - previousRating + rating) / currentReviews;
  } else {
    // New rating
    newReviews = currentReviews + 1;
    newRating = (currentRating * currentReviews + rating) / newReviews;
  }

  // Clamp to valid range (floating-point safety)
  newRating = Math.max(1, Math.min(5, newRating));

  const { error: updateError } = await supabase
    .from('products')
    .update({ rating: newRating, reviews: newReviews })
    .eq('id', productId);

  if (updateError) {
    throw new Error(updateError.message || 'فشل حفظ التقييم');
  }

  return { newRating, newReviews };
}
