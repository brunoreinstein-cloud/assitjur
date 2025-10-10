import { Suspense, ComponentType, ReactNode } from "react";
import { PageSkeleton, MapPageSkeleton, LoginPageSkeleton } from "./PageSkeleton";

interface LazyPageWrapperProps {
  children: ReactNode;
  skeleton?: "default" | "map" | "login";
}

/**
 * Wrapper para páginas lazy-loaded com skeletons específicos
 */
export function LazyPageWrapper({ children, skeleton = "default" }: LazyPageWrapperProps) {
  const getSkeleton = () => {
    switch (skeleton) {
      case "map":
        return <MapPageSkeleton />;
      case "login":
        return <LoginPageSkeleton />;
      default:
        return <PageSkeleton />;
    }
  };

  return (
    <Suspense fallback={getSkeleton()}>
      {children}
    </Suspense>
  );
}

/**
 * HOC para criar páginas lazy com skeleton específico
 */
export function withLazySkeleton<T extends object>(
  Component: ComponentType<T>,
  skeleton: "default" | "map" | "login" = "default"
) {
  return function LazyComponent(props: T) {
    return (
      <LazyPageWrapper skeleton={skeleton}>
        <Component {...props} />
      </LazyPageWrapper>
    );
  };
}
