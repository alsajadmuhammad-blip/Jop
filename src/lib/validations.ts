
import { z } from 'zod';

export const storeRegistrationSchema = z.object({
        storeName: z.string().min(3, "اسم المتجر مطلوب"),
        whatsappNumber: z.string().optional().refine(val => {
            if (!val) return true;
            return val.length >= 10;
        }, { message: "رقم الواتساب غير صالح" }),
        storeEmail: z.string().email("بريد إلكتروني غير صالح"),
        storeType: z.enum(["فعلي", "إلكتروني"], { required_error: "الرجاء اختيار نوع المتجر" }),
        marketType: z.string().min(2, "يرجى اختيار نوع السوق"),
        province: z.string().optional(),
        city: z.string().optional(),
        password: z.string().min(1, "كلمة المرور مطلوبة"),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
}).refine(data => {
    if (data.storeType === 'فعلي') {
        return !!data.province && data.province.length >= 2;
    }
    return true;
}, {
    message: "المحافظة مطلوبة للمتجر الفعلي",
    path: ["province"],
}).refine(data => {
    if (data.storeType === 'فعلي') {
        return !!data.city && data.city.length >= 2;
    }
    return true;
}, {
    message: "المدينة مطلوبة للمتجر الفعلي",
    path: ["city"],
});

export const customerRegistrationSchema = z.object({
    name: z.string().min(3, "الاسم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const productFormSchema = z.object({
  name: z.string().min(3, { message: "يجب أن يكون الاسم 3 أحرف على الأقل." }),
  description: z.string().min(10, { message: "يجب أن يكون الوصف 10 أحرف على الأقل." }),
  price: z.coerce.number().positive({ message: "الرجاء إدخال سعر صالح." }),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1, { message: "الرجاء اختيار فئة للمنتج." }),
});

export const submitRatingSchema = z.object({
  storeId: z.string().min(1),
  rating: z.number().min(1).max(5),
  userId: z.string().optional(), // No longer used for validation on the server, but keep for schema consistency
});

export const registerStoreActionSchema = z.object({
    ownerId: z.string().min(1, "Owner ID is required."),
    ownerEmail: z.string().email(),
    name: z.string().min(3, "اسم المتجر مطلوب"),
    type: z.enum(["فعلي", "إلكتروني"]),
    whatsappNumber: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

