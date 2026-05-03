
"use client";

import { useState, useCallback } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

type SuccessCallback = (position: Location) => void;
type ErrorCallback = (message: string) => void;

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = useCallback((onSuccess?: SuccessCallback, onError?: ErrorCallback) => {
    if (!navigator.geolocation) {
      const errorMsg = "المتصفح لا يدعم تحديد الموقع.";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        setError(null);
        setIsLocating(false);
        if (onSuccess) onSuccess(newLocation);
      },
      (geoError) => {
        let errorMsg = "حدث خطأ غير معروف.";
        switch(geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMsg = "تم رفض إذن الوصول إلى الموقع. يرجى تفعيله من إعدادات المتصفح.";
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMsg = "معلومات الموقع غير متاحة حالياً.";
            break;
          case geoError.TIMEOUT:
            errorMsg = "انتهت مهلة طلب الموقع.";
            break;
        }
        setError(errorMsg);
        setIsLocating(false);
        if (onError) onError(errorMsg);
      },
      { timeout: 10000, enableHighAccuracy: true } 
    );
  }, []);

  return { location, error, requestLocation, isLocating };
};
