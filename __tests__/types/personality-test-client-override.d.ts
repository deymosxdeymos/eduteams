// Loosen props for PersonalityTestClient in tests only to avoid strict prop requirements

declare module '../../src/components/onboarding/kepribadian/personality-test-client' {
  import type React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '@/components/onboarding/kepribadian/personality-test-client' {
  import type React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}
