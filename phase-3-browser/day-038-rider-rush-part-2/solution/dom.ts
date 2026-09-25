// The helper you wrote on Day 30.
export function getElement<T extends Element>(
  root: ParentNode,
  selector: string,
  type: { new (): T },
): T {
  const element = root.querySelector(selector);
  if (element === null) {
    throw new Error(`Missing element: ${selector}`);
  }
  if (!(element instanceof type)) {
    throw new Error(`${selector} is not a ${type.name}`);
  }
  return element;
}
