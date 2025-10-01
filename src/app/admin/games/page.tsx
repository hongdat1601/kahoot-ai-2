import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GamesRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      router.replace('/admin');
    } catch (e) {
      window.location.href = '/admin';
    }
  }, [router]);
  return null;
}
