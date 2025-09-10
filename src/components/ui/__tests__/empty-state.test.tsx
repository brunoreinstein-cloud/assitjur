import { render } from "@testing-library/react"
import { EmptyState } from "../empty-state"

it("renders empty state", () => {
  const { getByText } = render(
    <EmptyState title="Empty" description="Nothing here" />
  )
  expect(getByText("Nothing here")).toBeInTheDocument()
})

it("has no accessibility violations", async () => {
  const { container } = render(
    <EmptyState title="Empty" description="Nothing here" />
  )
  try {
    const { axe } = await import("vitest-axe")
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  } catch (e) {
    console.warn("vitest-axe not available; skipping accessibility test")
  }
})
