// `type` is a class like HTMLInputElement. Passing the class (not a string) means
// TypeScript knows the return type AND you can check it at runtime with instanceof.
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
