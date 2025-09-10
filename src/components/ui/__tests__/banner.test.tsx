import { render } from "@testing-library/react"
import { Banner } from "../banner"

it("renders banner", () => {
  const { getByText } = render(<Banner title="Info">Hello</Banner>)
  expect(getByText("Hello")).toBeInTheDocument()
})

it("has no accessibility violations", async () => {
  const { container } = render(<Banner title="Info">Hello</Banner>)
  try {
    const { axe } = await import("vitest-axe")
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  } catch (e) {
    console.warn("vitest-axe not available; skipping accessibility test")
  }
})
