/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "lottie-react" {
  import type { ComponentType } from "react";
  interface LottieProps {
    animationData?: object;
    loop?: boolean;
    className?: string;
    [key: string]: unknown;
  }
  const Lottie: ComponentType<LottieProps>;
  export default Lottie;
}
