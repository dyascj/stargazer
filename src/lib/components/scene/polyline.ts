import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Line, type Material } from 'three';

/**
 * A line strip of fixed vertex count whose buffers are rewritten in place.
 * Strips share each vertex between segments, so translucent lines have no
 * brighter dots at the joints the way overlapping fat-line segments do.
 */
export function createLineStrip(count: number, material: Material, withAlpha = false) {
  const geometry = new BufferGeometry();
  const attribute = (size: number) =>
    new BufferAttribute(new Float32Array(count * size), size).setUsage(DynamicDrawUsage);
  const positions = attribute(3);
  geometry.setAttribute('position', positions);
  const alphas = withAlpha ? attribute(1) : null;
  if (alphas) geometry.setAttribute('aAlpha', alphas);
  const line = new Line(geometry, material);
  line.frustumCulled = false;
  return { line, positions, alphas };
}
