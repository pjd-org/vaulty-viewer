import React from 'react';

export function createLazyRouteComponentMock() {
  return (
    importer: () => Promise<Record<string, unknown>>,
    exportName?: string
  ) => {
    let Loaded: React.ComponentType<any> | null = null;
    const pending = importer().then((mod) => {
      Loaded = (mod[exportName ?? 'default'] ?? mod.default) as
        | React.ComponentType<any>
        | null;
    });

    const LazyRouteComponent = (props: Record<string, unknown>) => {
      if (!Loaded) throw pending;
      return Loaded ? <Loaded {...props} /> : null;
    };

    (LazyRouteComponent as { preload?: () => Promise<void> }).preload = () =>
      pending.then(() => undefined);

    return LazyRouteComponent;
  };
}
