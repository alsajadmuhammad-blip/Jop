
import { Suspense } from 'react';
import SearchPageComponent from './search-component';
import { BackButton } from '@/components/layout/back-button';

function SearchLoading() {
  return <div className="container mx-auto p-8 text-center">جاري تحميل صفحة البحث...</div>;
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="absolute top-4 left-4 z-10">
          <BackButton />
        </div>
      <Suspense fallback={<SearchLoading />}>
        <SearchPageComponent />
      </Suspense>
    </div>
  );
}

    