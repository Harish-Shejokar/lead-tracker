import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount rendered components between tests so the DOM starts empty
afterEach(() => {
  cleanup();
});
