// Narrowed, valid definition for `nanostores/map-creator`
declare module 'nanostores/map-creator' {
  export type MapStore<T> = any;

  export interface MapCreator<Value extends object = any, Args extends any[] = []> {
    (id: string, ...args: Args): MapStore<Value>;
    build(id: string, ...args: Args): MapStore<Value>;
    cache: Record<string, MapStore<{ id: string } & Value>>;
  }

  export function mapCreator<Value extends object, Args extends any[] = [], StoreExt = Record<string, any>>(
    init?: (
      store: MapStore<{ id: string } & Value> & StoreExt,
      id: string,
      ...args: Args
    ) => (() => void) | void
  ): MapCreator<Value, Args>;
}

