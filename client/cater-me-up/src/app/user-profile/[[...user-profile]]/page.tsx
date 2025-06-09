import { UserProfile } from "@clerk/nextjs";
import React from 'react';

export default function Page() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <UserProfile path="/user-profile" routing="path" />
    </div>
  );
}
