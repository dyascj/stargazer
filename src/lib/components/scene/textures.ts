import {
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture
} from 'three';

const loader = new TextureLoader();
const cache = new Map<string, Promise<Texture>>();
let pending = 0;

/** Textures requested but not yet decoded; the intro waits for zero. */
export function pendingTextures(): number {
  return pending;
}

/** Load once and share. Color maps are sRGB; data maps (clouds, ring opacity) stay linear. */
export function loadTexture(url: string, color = true): Promise<Texture> {
  let texture = cache.get(url);
  if (!texture) {
    pending++;
    texture = loader
      .loadAsync(url)
      .then((map) => {
        map.colorSpace = color ? SRGBColorSpace : NoColorSpace;
        map.wrapS = RepeatWrapping;
        map.minFilter = LinearMipmapLinearFilter;
        map.anisotropy = 8;
        return map;
      })
      .finally(() => pending--);
    cache.set(url, texture);
  }
  return texture;
}

/** One unit sphere shared by every body; meshes scale it to their radius. */
export const UNIT_SPHERE = new SphereGeometry(1, 128, 64);
