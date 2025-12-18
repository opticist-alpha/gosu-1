import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "../src/shared/ui/Button";

describe("Button", () => {
  it("renders label", () => {
    render(<Button>확인</Button>);
    expect(screen.getByText("확인")).toBeInTheDocument();
  });
});
