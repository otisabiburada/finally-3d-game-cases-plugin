declare module "@decky/ui" { export const ButtonItem: any, Navigation: any, TextField: any, DialogButton: any, PanelSection: any, PanelSectionRow: any, Router: any, SliderField: any, staticClasses: any, ToggleField: any; }
declare module "@decky/api" { export const routerHook: any; export function definePlugin(f: (...a: any[]) => any): any; export function callable<A extends any[], R>(n: string): (...a: A) => Promise<R>; }
declare module "react" { export function useState<T>(v: T): [T, (x: T | ((p: T) => T)) => void]; export function useEffect(f: () => any, d?: any[]): void; }
declare module "react-icons/fa" { export const FaCube: any; }
