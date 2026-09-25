import type { InterleavedBuffer, InterleavedBufferAttribute } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * A fat polyline of fixed vertex count whose buffers are rewritten in place;
 * LineGeometry.setPositions would allocate new GPU buffers on every update.
 */
export function createPolyline(count: number, material: LineMaterial) {
  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array(count * 3));
  if (material.vertexColors) geometry.setColors(new Float32Array(count * 3));
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  const buffer = (name: string) =>
    (geometry.attributes[name] as InterleavedBufferAttribute | undefined)?.data ?? null;
  return { line, positions: buffer('instanceStart')!, colors: buffer('instanceColorStart') };
}

/** Write polyline vertex `k` of `count` into a [start, end] segment buffer. */
export function writeVertex(
  buffer: InterleavedBuffer,
  k: number,
  count: number,
  x: number,
  y: number,
  z: number
): void {
  const array = buffer.array as Float32Array;
  if (k > 0) {
    array[(k - 1) * 6 + 3] = x;
    array[(k - 1) * 6 + 4] = y;
    array[(k - 1) * 6 + 5] = z;
  }
  if (k < count - 1) {
    array[k * 6] = x;
    array[k * 6 + 1] = y;
    array[k * 6 + 2] = z;
  }
}
