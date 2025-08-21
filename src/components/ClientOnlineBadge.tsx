'use client';

import { useState, useEffect } from 'react';
import OnlineBadge from './OnlineBadge';

export default function ClientOnlineBadge() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <OnlineBadge />;
}
