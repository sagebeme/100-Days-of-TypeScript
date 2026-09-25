// `type` is a class like HTMLInputElement. Passing the class (not a string) means
// TypeScript knows the return type AND you can check it at runtime with instanceof.
export function getElement<T extends Element>(
  root: ParentNode,
  selector: string,
  type: { new (): T },
): T {
  // TODO: const element = root.querySelector(selector)
  // TODO: if it's null, throw `Missing element: ${selector}`
  // TODO: if it isn't an instance of `type`, throw `${selector} is not a ${type.name}`
  // TODO: return it (TypeScript now knows it's a T)
  throw new Error("not implemented yet");
}
