import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pager } from "@/components/ui/Pager";

describe("Pager", () => {
  test("shows the row range for the current page", () => {
    render(<Pager page={2} limit={10} total={34} onPageChange={vi.fn()} />);
    expect(screen.getByText("Rows 11–20 of 34")).toBeInTheDocument();
  });

  test("disables Prev on the first page and Next on the last", () => {
    const { rerender } = render(<Pager page={1} limit={10} total={34} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeEnabled();

    rerender(<Pager page={4} limit={10} total={34} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeEnabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  test("Next fires onPageChange with the next page", async () => {
    const onPageChange = vi.fn();
    render(<Pager page={2} limit={10} total={34} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("clicking a page number jumps to it; clicking the current page is a no-op", async () => {
    const onPageChange = vi.fn();
    render(<Pager page={2} limit={10} total={34} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await userEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  test("shows a fixed window of page numbers, centered on the current page", () => {
    // 100 rows / 10 = 10 pages; on page 5 the window is 3–7.
    render(<Pager page={5} limit={10} total={100} onPageChange={vi.fn()} />);
    for (const n of [3, 4, 5, 6, 7]) {
      expect(screen.getByRole("button", { name: String(n) })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "8" })).not.toBeInTheDocument();
  });
});
